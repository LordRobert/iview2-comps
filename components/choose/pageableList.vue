<template>
  <div>
    <div :style="listStyles">
      <slot></slot>
    </div>
    <slot name="empty" v-if="listData.length == 0 && !isLoading && pageNumber === 1"></slot>
    <div v-else>
      <div style="margin: 10px;overflow: hidden" v-if="pageable !== false">
        <div style="float: right;">
          <Page :total="total" :current="pageNumber" @on-change="onChange"
                @on-page-size-change="onPageSizeChange" :show-sizer="showSizer!==false"
                :page-size="pageSize" :page-size-opts="pageSizeOpts || [10, 20, 30, 40]"
                :show-elevator="showElevator!==false" :show-total="showTotal!==false"
                :simple="simple"></Page>
        </div>
      </div>
    </div>
  </div>
</template>
<script type="text/ecmascript-6">

  import DataAdapter from './dataAdapter'
  /**
   *
   * @options
   *    listData 表格数据
   *    pageable 是否有分页
   *    url 请求数据url
   *    pageSizeOpts 每页条数切换的配置
   *    showElevator 是否显示跳转至 默认显示
   *    showTotal 是否显示总条数
   *    showSizer 是否展示分页条数
   *    simple 简洁版
   *    manualLoadData 是否手动获取数据 此时表格初始化时不执行ajax获取数据
   *    listHeight 列表区域固定高度
   *    pageableSetting 返回数据中分页参数配置 {totalRoot, pageSizeRoot, pageNumberRoot, root}
   *
   *
   * @events
   *    on-after-ajax 当配置有url时  ajax返回后的事件
   *    on-page-change 有分页时 切换分页时的事件
   *    on-page-size-change 有分页时  切换每页展示条数时的事件
   *
   *  @example
   *
   *  <pageable-list :url="options.url" :simple="options.simple" :params="options.params" :list-data.sync="options.listData" style="margin-top: 16px;" v-ref:list  @on-after-ajax="afterAjax">
         <div v-for="item in options.listData" @click="select(item)" class="list-item" :class="{'selected':item.selected}">
         <Icon type="android-phone-portrait" :class="{'setted':item.schoolStatusMobile =='2'}"></Icon>
         <Icon type="android-desktop" :class="{'setted':item.schoolStatus =='2'}"></Icon>
         <span>{{item.schoolName}}</span>
         <a class="del" @click="$emit('on-del', item)" href="javascript:void(0);">删除</a>
         </div>
         <div slot="empty">
         没有租户信息
         </div>
      </pageable-list>
   *
   */
  export default {
    mock: mockData(),

    props: {
      manualLoadData: {
        type: Boolean,
        default: false
      },

      url: String,

      params: {
        type: Object,
        default: function () {
          return {}
        }
      },

      listData: {
        type: Array,
        default: function () {
          return []
        }
      },

      pageable: {
        type: Boolean,
        default: true
      },

      showSizer: {
        type: Boolean,
        default: true
      },

      pageSizeOpts: {
        type: Boolean,
      },

      showElevator: {
        type: Boolean,
        default: true
      },

      simple: {
        type: Boolean,
        default: true
      },

      showTotal: {
        type: Boolean,
        default: true
      },

      listHeight: {
        type: String,
        default: 'auto'
      },

      isEmpty:{
        twoWay:true,
        type:Boolean,
        default:false
      },

      pageableSetting:{
        type:Object,
        default:function () {
          return {}
        }
      }
    },

    computed: {
      listStyles: function () {
        if (this.listData.length == 0 && !this.isLoading && this.pageNumber === 1) {
          return
        } else {
          return {
            'height': this.listHeight
          }
        }
      }
    },

    created(){
      this.dataAdapter = new DataAdapter({
        url:this.url,
        totalRoot:this.pageableSetting.totalRoot || 'datas>totalSize',
        pageSizeRoot:this.pageableSetting.pageSizeRoot || 'datas>pageSize',
        pageNumberRoot:this.pageableSetting.pageNumberRoot || 'datas>pageNumber',
        root:this.pageableSetting.root || 'datas>rows'
      })
    },

    data: function () {
      return {
        total: 0,
        pageSize: 10,
        pageNumber: 1,
        isLoading: true
      }
    },

    ready(){
      this.$emit('on-ready')
      if (this.url && this.manualLoadData !== true) {
        this._reload()
      }
    },

    methods: {
      _reload(){
        this.isLoading = true

        this.dataAdapter.load(this.pageSize, this.pageNumber, this.params).then( (res) => {
          this.isLoading = false

          if(res.original && res.original.code === "0"){
              this.total = res.total
              this.$emit('on-after-ajax', res.list)
          } else{
              this.total = 0
              // 给出错误提示
              this.$emit('on-after-ajax', [])
              this.$Message.error(res.original.message)
          }
        })
      },

      reload(){
        this._reload()
      },

      reloadFirstPage(){
        
        this.pageNumber = 1
        this.reload()
      },

      onChange(pageNumber){
        this.pageNumber = pageNumber
        this.$emit('on-page-change')
        if (this.url) {
          this._reload()
        }
      },

      onPageSizeChange(pageSize){
        this.$emit('on-page-size-change')
        this.pageSize = pageSize
        if (this.url) {
          this._reload()
        }
      },

      resetIsEmpty(){
        if(this.listData.length == 0 && !this.isLoading && this.pageNumber === 1){
          this.isEmpty = true
        }else{
          this.isEmpty = false
        }
      }
    }
  }

  function mockData() {
    return {}
  }
</script>
