<template>
    <div>
        <div class="demo-upload-list" v-for="item in fileList" v-if="item.state !== 'remove'">
            <template v-if="item.state !== 'uploading'">
                <img :src="item.url">
                <div class="demo-upload-list-cover" v-if="!uploadOpt.readonly">
                    <Icon type="ios-eye-outline" @click.native="handleView(item)"></Icon>
                    <Icon type="ios-trash-outline" @click.native="handleRemove(item)"></Icon>
                </div>
            </template>
            <template v-else>
                <Spin class="upload-spin" fix>
                    <Icon type="load-c" :size="18" class="demo-spin-icon-load"></Icon>
                    <div>上传中...</div>
                </Spin>
            </template>
        </div>
        <Upload
            v-if="loaded && uploadVisible"
            ref="upload"
            :show-upload-list="false"
            :on-success="handleSuccess"
            :format="uploadOpt.format"
            :max-size="uploadOpt.maxSize"
            :on-format-error="handleFormatError"
            :before-upload="beforeUpload"
            :on-exceeded-size="handleMaxSize"
            :multiple="uploadOpt.multiple"
            type="drag"
            action="/tmp"
            style="display: inline-block;width:100px;height:100px;">
            <div style="text-align:center;height:100px;width:100px;padding-top:17px;">
                <Icon type="plus-circled" size="24" color="#2E8CF0"></Icon>
                <div class="upload-tip" style="line-height:30px;">
                    <strong style="color: #747986;font-size:14px;">点击上传</strong>
                </div>
            </div>
        </Upload>
        <Modal title="查看图片" v-model="imageModal">
            <img :src="imageModalUrl" v-if="imageModal" style="width: 100%">
        </Modal>
        <Modal title="裁剪图片" v-model="cropperOpt.visible" @on-ok="clipOk" :loading="cropperOpt.loading">
            <cropper ref="cropper" v-if="cropperOpt.visible" :option="cropperOpt"></cropper>
        </Modal>
    </div>
</template>
<script>
/*
使用方法：
<upload-oss :option="options" :default-list="defaultList" :crop-option="cropOpt"></upload-oss>
options示例：
{
    stsUrl: '',
    format: ['jpg', 'jpeg', 'png'],
    readonly: false,
    maxSize: 1024,
    limit: 1,
    multiple: false
}
cropOption
{
    enable: true,
    width: 200,
    height: 200
}

defaultList: [{
    id: '', // oss key
    url: '', // 全路径
    state: 'origin' // 原有origin 新增add 删除remove
}]

获取值
vm.$refs.uploadoss.getFileList()
*/
    import Cropper from 'com/Cropper.vue'
    import util from 'conf/util'
    import api from 'conf/api'
    import moment from 'moment'

    const _base64toBuffer = (data) => {
        var arr = data.split(',')
        var mime = arr[0].match(/:(.*?);/)[1]
        var binaryString = window.atob(arr[1])
        var len = binaryString.length
        var bytes = new Uint8Array(len)
        for (var i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        return new Buffer(bytes, {type: mime})
    }

    const _getSTS = () => {
        return util.httpGet(api.getSTS, undefined, util.handler.DATAS)
    }

    var _currentFileName;
    var _currentFileObj;

    export default {
        props: {
            option: {
                type: Object
            },
            cropOption: {
                type: Object,
                default: () => ({enable: false})
            },
            defaultList: {
                type: Array,
                default: () => ([])
            }
        },
        data () {
            return {
                loaded: false,
                imageModal: false,
                imageModalUrl: '',
                fileList: [],
                uploadOpt: {},
                defaultOpt: {
                    format: ['jpg', 'jpeg', 'png'],
                    readonly: false,
                    maxSize: 1024,
                    multiple: false,
                    limit: 1
                },
                cropperOpt: {
                    loading: true,
                    visible: false,
                    img: '',
                    autoCrop: true,
                    fixedBox:true,
                    autoCropWidth: 200,
                    autoCropHeight: 200
                }
            }
        },
        computed: {
            uploadVisible() {
                if (this.uploadOpt.readonly) {
                    return false
                }
                if (this.validFileListLength >= this.uploadOpt.limit) {
                    return false
                }
                return true
            },
            validFileListLength () {
                var len = this.fileList.reduce((sumSoFar, item) => {
                    return item.state === 'remove' ? sumSoFar : sumSoFar + 1
                }, 0)
                return len
            }
        },
        methods: {
            beforeUpload (file) {
                const self = this
                // 个数校验
                if (this.validFileListLength >= this.uploadOpt.limit) {
                    this.$Notice.warning({
                        title: '文件个数超过设置上限',
                        desc: '配置最多 ' + this.uploadOpt.limit + ' 个'
                    })
                    return false
                }
                // 扩展名校验
                var reg = RegExp( this.uploadOpt.format.join("|"))
                if (!reg.test(file.name)) {
                    this.handleFormatError(file)
                    return false
                }
                // 读取扩展名并生成文件名
                var suffix = file.name.match(/\.\w+$/)
                if (suffix && suffix.length > 0) {
                    suffix = suffix[0]
                } else {
                    self.$Message.error('图片名称有误')
                    let index = self.fileList.findIndex((item) => { return item.id === newFile.id })
                    self.fileList.splice(index, 1)
                    return
                }
                var name = moment().format('YYYYMMDDHHmmssSSS') + ('' + Math.random()).substr(-5) + suffix

                var newFile = {
                    id: Math.random(),
                    url: '',
                    state: 'uploading'
                }
                self.fileList.push(newFile)

                const reader = new FileReader();
                reader.onload = function (data) {
                    var base64 = data.currentTarget.result
                    if (self.cropOption.enable === true) {
                        _currentFileName = name;
                        _currentFileObj = newFile;
                        self.showCropper(base64)
                    } else {
                        self.upload(base64, name, newFile)
                    }
                }
                reader.readAsDataURL(file);
                return false
            },
            showCropper(base64) {
                this.cropperOpt.autoCropWidth = this.cropOption.width || 200;
                this.cropperOpt.autoCropHeight = this.cropOption.height || 200;
                this.cropperOpt.img = base64;
                this.cropperOpt.visible = true;
            },
            clipOk() {
                var self = this
                this.$refs.cropper.getCropData((data) => {
                    self.upload(data, _currentFileName, _currentFileObj)
                })
            },
            resetCropperLoading() {
                this.cropperOpt.loading = false
                this.$nextTick(() => {
                    this.cropperOpt.loading = true
                })
            },
            upload (base64, name, newFile) {
                var self = this
                _getSTS().then((datas) => {
                    self.save2OSS(datas, base64, datas.dir + '/' + name, newFile)
                }).catch((err) => {
                    self.resetCropperLoading()
                    self.$Message.error('网络发生错误，请稍后再试')
                    let index = self.fileList.findIndex((item) => { return item.id === newFile.id })
                    self.fileList.splice(index, 1)
                })
            },
            save2OSS (sts, base64, key, newFile) {
                const self = this
                var client = new OSS.Wrapper({
                    accessKeyId: sts.accessKeyId,
                    accessKeySecret: sts.accessKeySecret,
                    stsToken: sts.securityToken,
                    // endpoint: sts.endpoint, //
                    region: 'oss-cn-hangzhou',
                    bucket: sts.bucket,
                    secure: true
                })

                var buffer = _base64toBuffer(base64)
                client.put(key, buffer).then((result) => {
                    if (result.res.status === '200' || result.res.status === 200) {
                        self.cropperOpt.visible = false
                        console.log(result)
                        newFile.id = result.name.substring(1)
                        newFile.url = result.url
                        newFile.state = 'add'
                    } else {
                        self.resetCropperLoading()
                        self.$Message.error('上传失败：' + JSON.stringify(result))
                        let index = self.fileList.findIndex((item) => { return item.id === newFile.id })
                        self.fileList.splice(index, 1)
                    }
                })
            },
            handleView(file) {
                this.imageModal = true;
                this.imageModalUrl = file.url;
            },
            handleRemove(file) {
                if (file.state === 'add') {
                    var index = this.fileList.findIndex((item) => { return item === file })
                    this.fileList.splice(index, 1)
                } else if (file.state === 'origin') {
                    file.state = 'remove'
                }
            },
            handleSuccess(res, file) {
                // file.url = file.response.datas.fileUrl
            },
            handleFormatError(file) {
                this.$Notice.warning({
                    title: '文件格式不正确',
                    desc: '文件 ' + file.name + ' 格式不正确，请上传' + this.uploadOpt.format.join('|') + '格式的图片。'
                });
            },
            handleMaxSize(file) {
                this.$Notice.warning({
                    title: '超出文件大小限制',
                    desc: '文件 ' + file.name + ' 太大，不能超过 ' + this.uploadOpt.maxSize + 'kb。'
                });
            },
            resetList () {
                this.fileList = this.defaultList.map((item) => {
                    return {
                        id: item.id,
                        url: item.url,
                        state: item.state
                    }
                })
            },
            init () {
                if (this.option.readonly === false && !this.option.stsUrl) {
                    console.error('[uploadOss]: stsUrl has not defined in option.')
                }
                this.uploadOpt = Object.assign({}, this.defaultOpt, this.option)
                if (this.defaultList && this.defaultList.length > 0) {
                    this.resetList()
                }
                this.loaded = true
            },
            getFileList () {
                return this.fileList
            }
        },
        mounted() {
            this.init()
        },
        components: {
            Cropper
        },
        watch: {
            'defaultList' () {
                this.resetList()
            },
            'option' () {
                this.uploadOpt = Object.assign({}, this.defaultOpt, this.option)
                this.loaded = false
                this.$nextTick(() => {
                    this.loaded = true
                })
            },
        }

    }
</script>
<style lang="less" rel="stylesheet/less" scoped>
    .demo-spin-icon-load{
        animation: ani-demo-spin 0.7s linear infinite;
    }
    .demo-upload-list {
        display: inline-block;
        width: 100px;
        height: 100px;
        text-align: center;
        line-height: 100px;
        border-radius: 4px;
        overflow: hidden;
        background: #fff;
        position: relative;
        box-shadow: 1px 1px 1px rgba(0, 0, 0, .2);
        margin:0 10px;
    }

    .demo-upload-list img {
        max-width: 100%;
        max-height: 100%;
        vertical-align: middle;
    }

    .demo-upload-list-cover {
        line-height: 100px;
        display: none;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, .6);
    }

    .demo-upload-list:hover .demo-upload-list-cover {
        display: block;
    }

    .demo-upload-list-cover i {
        color: #fff;
        font-size: 23px;
        cursor: pointer;
        margin: 0 8px;
    }

    .upload-spin {
        line-height: 2em;
    }
</style>