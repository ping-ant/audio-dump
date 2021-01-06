/**
 * 模块导入
 */
const chalk = require('chalk');
const fs = require('fs-extra')
const path = require('path');
const ProgressBar = require('progress');

/**
 * 获取命令行参数
 * 参数数组：args
 */
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(chalk.red("Error: 请输入目标文件夹名称"));
  process.exit(1);
}

/**
 * 获取目标文件夹名称
 * 目标文件夹名称：targetFolder
 */
const targetFolder = args[0];
console.log(chalk.green(`目标文件夹：${targetFolder}`));
let stats;
try {
  stats = fs.statSync(targetFolder);
} catch (err) {
  console.error(chalk.red("Error: 文件打开错误"));
  process.exit(1);
}
if (!stats.isDirectory()) {
  console.error(chalk.red("Error: 请输入正确的文件夹名称"));
  process.exit(1);
}

/**
 * 重命名其中的文件
 */
let subFileList = fs.readdirSync(targetFolder).map(fileName => {
  return path.join(targetFolder, fileName);
}).filter( fileName => fs.statSync(fileName).isFile() );
const bar = new ProgressBar('[:bar] :percent', { total: subFileList.length });
for(let file of subFileList) {
  let newName = path.join( path.dirname(file), path.basename(file, path.extname(file)) + ".mp3" );
  fs.renameSync(file, newName);
  bar.tick();
  if (bar.complete) {
    console.log(chalk.green("done"));
  }
}