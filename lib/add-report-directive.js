module.exports = function addReportDirective (directives) {
  var reportUri = directives.reportUri || directives['report-uri']
  var reportTo = directives.reportTo || directives['report-to']

  if (reportUri) {
    return Object.assign({}, directives, {
      'report-to': reportUri
    })
  } else if (reportTo) {
    return Object.assign({}, directives, {
      'report-uri': reportTo
    })
  } else {
    return directives
  }
}
