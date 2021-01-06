/**
 * 模块导入
 */
const chalk = require('chalk');
const fs = require('fs-extra')
const path = require('path');
const readlineSync = require('readline-sync');
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
 * 获取目标文件夹的子文件夹数组
 * 子文件夹数组：subDirList
 */
const isDirectory = fileName => {
  return fs.statSync(fileName).isDirectory();
};
let subDirList = fs.readdirSync(targetFolder).map(fileName => {
  return path.join(targetFolder, fileName);
}).filter(isDirectory);
console.log(chalk.grey("目标文件夹包含："));
for(let dir of subDirList) {
  console.log(chalk.grey(dir));
}

/**
 * 从文件夹搜索指定文件
 * 输入：目标文件夹路径、目标文件名称
 * 输出：目标文件路径（未找到则返回空字符串，只返回最先找到的）
 */
function searchFile(targetFolder, targetFile) {
  let subFileList = fs.readdirSync(targetFolder).map(fileName => {
    return path.join(targetFolder, fileName);
  }).filter( fileName => fs.statSync(fileName).isFile() );
  let subDirList = fs.readdirSync(targetFolder).map(fileName => {
    return path.join(targetFolder, fileName);
  }).filter( fileName => fs.statSync(fileName).isDirectory() );
  for (let f of subFileList) {
    if (path.basename(f) === targetFile) {
      return f;
    }
  }
  for (let d of subDirList) {
    let res = searchFile(d, targetFile);
    if(res) return res;
  }
  return "";
}

/**
 * 从信息文件(entry.json)中获取标题(title)
 * 输入：信息文件路径
 * 输出：标题字符串
 */
function getTitle(infoFile) {
  const data = fs.readFileSync(infoFile);
  const content = JSON.parse(data);
  const title = content.title;
  return title;
}

/**
 * 重命名并移动文件
 * 输入：目标文件路径、新名称、新目录
 */
function moveFile(targetFile, newName, newFolder) {
  console.log(chalk.grey(`move ${targetFile} as ${newName} to ${newFolder}`));
}

/**
 * 创建保存结果的文件夹（与旧文件夹同级）
 * 输入：旧文件夹路径
 */
function createNewFolder(targetFolder, newFolderNameBase="result") {
  const parentDir = path.resolve(path.dirname(targetFolder));
  console.log(chalk.green(`目标文件夹所在目录：${parentDir}`));
  let newFolderName = newFolderNameBase, append = 1;
  while( fs.existsSync(path.join(parentDir, newFolderName)) ) {
    ++append;
    newFolderName = `${newFolderNameBase}-${append}`;
  }
  const newFolder = path.join(parentDir, newFolderName);
  try {
    fs.mkdirSync( newFolder );
  } catch (err) {
    console.error(chalk.red("Error: 新文件夹创建失败"));
    process.exit(1);
  }
  console.log(chalk.green(`新文件夹创建成功：${newFolder}`));
  return newFolder;
}


// 获取文件信息对列表
let fileEntryList = [];
for (let d of subDirList) {
  let infoFile = searchFile(d, "entry.json");
  let audioFile = searchFile(d, "audio.m4s");
  let newEntry = {};
  if (infoFile && audioFile) {
    let title = getTitle(infoFile);
    if (!title) {
      console.error(chalk.red(`Error: 无法获取标题信息(${infoFile})`));
      continue;
    } else {
      console.log(chalk.grey(`获取标题成功：${title}`));
      newEntry.title = title;
      newEntry.path = audioFile;
      fileEntryList.push(newEntry);
    }
  } else {
    console.error(chalk.yellow(`未找到目标文件：${d}`));
  }
}
// 询问是否继续
let choice = readlineSync.question("是否开始执行任务(yes/no)：");
if (choice !== "yes") {
  process.exit(0);
}
const newFolder = createNewFolder(targetFolder);
const total = fileEntryList.length;
const bar = new ProgressBar('[:bar] :percent', { total: total });
for (let entry of fileEntryList) {
  fs.copyFileSync(entry.path, path.join(newFolder, entry.title + ".m4s"));
  bar.tick();
  if (bar.complete) {
    console.log(chalk.green("done"));
  }
}
