<style scoped>

</style>

<template>

<div class="container">
    <Table
        v-if="tableFresh"
        border
        :loading="loading"
        :columns="columns"
        :data="source"
        @on-selection-change="selectionChange"
        size="small"
        @on-select-cancel="unselectRow">
        <!-- @on-select="selectRow" -->
    </Table>
    <Page class="bh-mt-16" :page-size="pager.pageSize" :current="pager.pageNumber"
        :total="pager.total"  show-total  :page-size-opts="[5, 10, 20, 50]"
        placement="top" @on-change="pageChange" @on-page-size-change="pageSizeChange"></Page>
        <!-- show-sizer -->
</div>

</template>

<script>
import util from 'conf/util.js'

export default {
    /*

    demo:
    <UTable ref="table" :columns="columns" :options="options" :data-optimize="setDataStyle"></UTable>

    columns: 同iview参数,
    data-optimize: 数据与处理方法，比如增加样式属性等,
    options: {
        url: service.api.getAppletList,
        queryParams: {
            appletId: '',
            appletName: ''
        }
    }

    */
    components: {
    },
    data () {
        return {
            loading: false,
            tableFresh: true,
            selectedRows: [],
            source: [],
            queryParams: {},
            pager: {
                pageNumber: 1,
                pageSize: 10,
                total: 0
            }
        }
    },
    mounted () {
        if (!this.lazyLoad) {
            this.initSource()
        }
    },
    methods: {
        freshTable () {
            this.tableFresh = false
            this.$nextTick(() => {
                this.tableFresh = true
            })
        },
        initSource () {
            this.goFirstPage()
            this.queryParams = this.options.queryParams
            this.getSource()
        },
        getSource () {
            // this.$Loading.start()
            let self = this
            let queryParams = $.extend(true, {}, this.queryParams, this.pager)
            if (self.data && self.data.length > 0) {
                self.source = self.data
                self.pager.total = self.data.length
            } else {
                this.loading = true
                util.httpPost(self.options.url, queryParams, util.handler.DATAS).then((data) => {
                    // this.$Loading.finish()
                    // 删除非第一页最后一条的情况
                    var rows = data.rows && data.rows.length ? data.rows : []
                    if (rows.length === 0 && this.pager.pageNumber > 1) {
                        this.pager.pageNumber--
                        this.getSource()
                    }
                    if (rows.length > 10) {
                        rows = rows.splice((this.pager.pageNumber - 1) * 10, 10)
                    }
                    if (this.dataOptimize) {
                        rows = this.dataOptimize(rows)
                    }
                    self.source = rows
                    self.pager.total = data.totalSize
                    this.selectedRows = []
                }).catch((error) => {
                    // this.$Loading.error()
                    this.$Message.error('异常：' + error.message)
                }).then(() => {
                    this.loading = false
                })
            }
        },
        goFirstPage () {
            this.pager.pageNumber = 1
        },
        pageChange (num) {
            this.pager.pageNumber = num
            this.reload()
        },
        pageSizeChange (size) {
            this.pager.pageSize = size
            this.goFirstPage()
            this.reload()
        },
        selectionChange (rows) {
            this.selectedRows = rows
            this.$emit('on-selection-change', rows)
        },
        getSelectedRows (rows) {
            return this.selectedRows
        },
        reload (params) {
            if (params) {
                this.goFirstPage()
                this.queryParams = params
                this.getSource()
            } else {
                this.getSource()
            }
        },
        refreshTableChecked (cb) {
            this.source.forEach((row) => {
                if (cb(row)) {
                    this.$set(row, '_checked', true)
                } else {
                    this.$set(row, '_checked', false)
                }
            })
        },
        refreshTableCheckDisabled (cb) {
            this.source.forEach((row) => {
                if (cb(row)) {
                    this.$set(row, '_disabled', true)
                } else {
                    this.$set(row, '_disabled', false)
                }
            })
        },
        selectRow (selection, row) {
            // this.source.forEach((r, index) => {
            //     if (r === row) {
            //         this.$set(this.source[index], '_checked', true)
            //     }
            // })
            this.$emit('on-select', selection, row)
        },
        unselectRow (selection, row) {
            this.$emit('on-select-cancel', selection, row)
        }
    },
    props: {
        columns: {
            required: true,
            type: Array,
            default: () => []
        },
        options: {
            required: true,
            type: Object,
            default: () => {}
        },
        lazyLoad: {
            type: Boolean,
            default: false
        },
        dataOptimize: {
            type: Function
        },
        data: {
            required: false,
            type: Array,
            default: () => []
        }
    }
}

</script>
