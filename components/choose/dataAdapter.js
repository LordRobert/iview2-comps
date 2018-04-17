/**
 * totalRoot default = datas>totalSize
 * pageSizeRoot default = datas>pageSize
 * pageNumberRoot default = datas>pageNumber
 * root default = datas>rows
 */
import util from 'conf/util'
var defaultConfig = {
  totalRoot:'datas>totalSize',
  pageSizeRoot:'datas>pageSize',
  pageNumberRoot:'datas>pageNumber',
  root:'datas>rows'
}

function adapter(options) {

  options = Object.assign({}, defaultConfig, options)

  var pageSizeName = getLastElement(options.pageSizeRoot)
  var pageNumberName = getLastElement(options.pageNumberRoot)

  this.load = function(pageSize, pageNumber, params){
    var config = {}

    config[pageSizeName] = pageSize
    config[pageNumberName] = pageNumber

    return util.httpPost(options.url, Object.assign(config, params)).then((res) => {
      var result = {
        total:pickData(res, options.totalRoot),
        list:pickData(res, options.root),
        pageSize:pickData(res, options.pageSizeRoot),
        pageNumber:pickData(res, options.pageNumberRoot),
        original:res
      }

      return result
    }).catch((err) => {
      console.error('请求返回异常：')
      console.error(err)
      return {}
    });
  }
}


function pickData(data, root){
  var tempValue = data
  var rootArray = root.split('>')
  rootArray.forEach(function (item) {
    if (!tempValue[item]) {
      return false
    }
    tempValue = tempValue[item]
  })
  return tempValue
}


function getLastElement(val) {
  var arr = val.split('>')

  if(val.length == 0){
    return val
  }

  return arr[arr.length - 1]
}


export default adapter
