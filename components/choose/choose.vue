<template>
  <div class="main">
    <div class="left-container">
      <div class="search-wrap">
        <i-input v-model="keyword" :placeholder="placeholder" style="width: 100%" @on-enter="search" :maxlength="50"></i-input>
      </div>
      <pageable-list :url="url" :list-data="listData" :params="requestParams"
                     list-height="220px"
                     :pageable-setting="pageableSetting"
                     :is-empty.sync="listEmpty"
                     @on-after-ajax="afterAjax" ref="pageableList">
        <div v-for="item in listData" class="left-item">
          <Checkbox v-model="item._selected" :disabled="maxSelectNum !== 0 && selectedList.length >= maxSelectNum" @on-change="change(item)">
          </Checkbox>
          <div class="item-label" v-html="realRenderLeft(item)"></div>
        </div>
        <div slot="empty" style="text-align: center; margin-top: 32px;">
          暂无数据
        </div>
      </pageable-list>
      <!-- <Checkbox :checked="selectAllStatus" class="select-all" @on-change="selectAll" v-if="listData.length > 0">全选</Checkbox> -->
    </div>
    <div class="right-container">
      <div class="selected-tip">已选中{{selectedList.length}}</div>
      <div class="right-selected-wrap">
        <div v-for="sitem in selectedList" class="selected-item">
            <span v-html="realRenderRight(sitem)"></span>
            <span class="delete" @click="del(sitem[keys])">删除</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
  /***
   *
   * @options
   *
   * url 左侧请求url
   * selectedList 选中的记录
   * keys 主键属性名
   * placeholder placeholder
   * params 参数
   * renderLeft(row) 左侧渲染函数
   * renderRight(row) 右侧渲染函数
   *
   * @methods
   *
   * getSelected 获取右侧选中结果
   *
   * @example
   *
   <choose
        v-ref:choose
        keys="id"
        searchKey="content"
        :params="options.params"
        :url="options.url"
        :render-left="renderLeft"
        :render-right="renderRight"
        :selected-list.sync="options.selectedList">
   </choose>
   */
  import pageableList from './pageableList.vue'
  export default {
    props: {
      url: String,

      selectedList: {
        type: Array,
        default: function () {
          return []
        }
      },
      keys: {
        type: String,
        default: 'id'
      },

      placeholder: {
        type: String,
        default: '请输入关键字'
      },

      searchKey: {
        type: String,
        default: 'content'
      },

      params: {
        type: Object,
        default: function () {
          return {}
        }
      },

      renderRight: {
        type: Function
      },

      renderLeft: {
        type: Function
      },

      pageableSetting: {
        type: Object,
        default: function () {
          return {}
        }
      },

      maxSelectNum: {
        type: Number,
        default: 0 // 0 代表无限制
      }

    },

    data () {
      return {
        listData: [],
        keyword: '',
        listEmpty:false
      }
    },

    // attached(){
    //   this.$compile(this.$el)
    // },

    computed: {
      selectAllStatus: function () {
        var status = true

        this.listData.forEach((item)=> {
          if (!item._selected) {
            status = false
          }
        })

        return status
      },

      requestParams: function () {
        var params = {}

        params[this.searchKey] = this.keyword

        params = Object.assign({}, this.params, params)

        return params
      }
    },

    methods: {
      afterAjax: function (list) {
        if (!list) return;
        list.forEach((item) => {
          item._selected = false

          var row = this._findRightRowById(item[this.keys])

          if (row) {
            item._selected = true
          }
        })
        this.listData = list;
      },

      realRenderRight: function (item) {
        var template = this.renderRight(item)

        return template
      },

      realRenderLeft(item){
        var template = this.renderLeft(item)

        return template
      },

      search(){
        this.$refs.pageableList.reloadFirstPage()
      },

      del(id){
        this._deleteRightRowById(id)

        var leftRow = this._findLeftRowById(id)

        if (leftRow) {
          leftRow._selected = false
        }
      },

      change(item){
        if (item._selected) {
          this.selectedList.push(item)
        } else {
          this._deleteRightRowById(item[this.keys])
        }

        // this.$nextTick(function () {
        //   this.$compile(this.$el)
        // })
      },

      getSelected(){
        return this.selectedList
      },

      selectAll(status){
        this.listData.forEach((item) => {
          item._selected = status

          var index
          this.selectedList.forEach((item2, i) => {
            if (item[this.keys] == item2[this.keys]) {
              index = i
            }
          })

          if (status && index == -1) {
            this.selectedList.push(item)
          }

          if (!status && index >= 0) {
            this.selectedList.splice(index, 1)
          }
        })
        // this.$nextTick(function () {
        //   this.$compile(this.$el)
        // })
      },

      _findLeftRowById(id){
        return this.listData.filter((item) => {
          return item[this.keys] == id
        })[0]
      },

      _findRightRowById(id){
        return this.selectedList.find((item) => {
          return item[this.keys] == id
        })
      },

      _deleteRightRowById(id){
        var index
        this.selectedList.forEach((item, i) => {
          if (item[this.keys] == id) {
            index = i
          }
        })
        this.selectedList.splice(index, 1)
      }
    },
    components: {
      pageableList
    },
    mounted () {
        this.search();
    }
  }
</script>
<style scoped lang="less" rel="stylesheet/less">
  .main {
    border: 1px solid #D8DCF0;
    user-select: none;
  }

  .left-container {
    display: inline-block;
    padding: 16px;
    padding-bottom: 0px;
    width: 50%;
    position: relative;
    height: 325px;

    .left-item {
      padding: 2px 0;
      padding-bottom: 3px;

      .item-label{
        display: inline-block;
        width: calc(~"100% - 26px");
        vertical-align: bottom;
      }
    }

    .search-wrap {
      margin-bottom: 8px;
    }

    .select-all {
      position: absolute;
      bottom: 18px;
    }
  }

  .right-container {
    padding: 16px 0 16px 32px;
    display: inline-block;
    width: calc(~"100% - 50% - 4px");
    vertical-align: top;
    position: relative;
    background: rgba(63, 81, 181, .04);
    height: 325px;
    border-left: 1px solid #D8DCF0;

    .selected-item {
      position: relative;
      padding:2px 0;
    }

    .selected-tip {
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 8px;
    }

    &:after, &:before {
      width: 0;
      height: 0;
      content: ' ';
      position: absolute
    }

    &:before {
      border: 44px solid transparent;
      border-left: 14px solid #D8DCF0;
      top: 128px;
      left: 0
    }

    &:after {
      border: 44px solid transparent;
      border-left: 14px solid #fff;
      top: 128px;
      left: -1px;
    }

    .right-selected-wrap {
      height: 270px;
      overflow: auto;
      padding-right: 16px;
    }

  }
</style>
<style lang="less" rel="stylesheet/less">
  .right-container .selected-item {

    .delete {
      position: absolute;
      display: block;
      right: 0;
      top: 0;
      color: #39f;
      cursor: pointer;
    }

    &:hover .delete {
      display: block;
    }
  }
</style>
