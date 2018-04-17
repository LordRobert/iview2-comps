<template>
    <div class="cropper-box">
        <vue-cropper ref="cropper"
                     :img="cropperOpt.img"
                     :autoCrop="cropperOpt.autoCrop"
                     :autoCropWidth="cropperOpt.autoCropWidth"
                     :autoCropHeight="cropperOpt.autoCropHeight"
                     :fixed="cropperOpt.fixed"
                     :fixedNumber="cropperOpt.fixedNumber"
                     :fixedBox="cropperOpt.fixedBox">
        </vue-cropper>
    </div>
</template>
<script>
/*
 * @link VueCropper https://github.com/xyxiao001/vue-cropper
 */
import VueCropper from 'vue-cropper'
export default {
    props: {
        option: {
            type: Object
        }
    },
    data () {
        return {
            cropperOpt: JSON.parse(JSON.stringify(this.option))
        }
    },
    methods: {
        getCropData (callback) {
            this.$refs.cropper.getCropData(data => {
                callback && callback(data)
            })
        },
        getCropBlob (callback) {
            this.$refs.cropper.getCropBlob(data => {
                callback && callback(data)
            })
        }
    },
    components: {
        VueCropper
    }
}
</script>
<style lang="less" rel="stylesheet/less" scoped>
    .cropper-box {
        height: 300px;
    }
</style>
