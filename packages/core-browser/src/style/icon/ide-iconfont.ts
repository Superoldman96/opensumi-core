export const IDE_ICONFONT_CN_CSS = '//at.alicdn.com/t/a/font_1432262_eyib2sbslul.css';

export const IDE_ICONFONT_CN_JS = IDE_ICONFONT_CN_CSS.replace(/\.css$/, '.js');

export const IDE_OCTICONS_CN_CSS =
  '//gw.alipayobjects.com/os/Kaitian/c7ae5acb-da70-4f05-b83d-93b345dc5c53/octicons-cdn.css';

const codiconsPkg = '@vscode/codicons';
// alipayobjects icon 不带@
const codiconsCDNPkg = 'vscode/codicons';
const codiconsPkgVersion = require('../../../package.json').dependencies[codiconsPkg];

export const IDE_CODICONS_CN_CSS = `//gw.alipayobjects.com/os/lib/${codiconsCDNPkg}/${codiconsPkgVersion}/dist/codicon.css`;
