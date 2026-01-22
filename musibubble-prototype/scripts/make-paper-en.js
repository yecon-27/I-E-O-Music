const fs = require('fs');
const path = require('path');

function hasCJK(str) {
  return /[\u4e00-\u9fff]/.test(str);
}

function removeChineseComments(content, ext) {
  let out = content;
  if (ext === '.js' || ext === '.css') {
    out = out
      .replace(/\/\*[^]*?\*\//g, m => (hasCJK(m) ? '' : m))
      .replace(/(^|\n)\s*\/\/[^\n]*\n/g, m => (hasCJK(m) ? '\n' : m));
  } else if (ext === '.html') {
    out = out.replace(/<!--[^]*?-->/g, m => (hasCJK(m) ? '' : m));
  }
  return out;
}

function replaceIndexTexts(html) {
  const map = new Map([
    ['静音', 'Mute'],
    ['取消静音', 'Unmute'],
    ['参数', 'Settings'],
    ['中/EN', 'EN'],
    ['慢速', 'Slow'],
    ['正常', 'Normal'],
    ['快速', 'Fast'],
    ['暂停', 'Pause'],
    ['游戏已暂停', 'Game Paused'],
    ['点击继续按钮恢复游戏', 'Click resume to continue'],
    ['专家模式', 'Expert Mode'],
    ['退出专家模式', 'Exit Expert Mode'],
    ['游戏结束', 'Game Over'],
    ['成功击破', 'Bubbles Popped'],
    ['个泡泡', 'bubbles'],
    ['平均速度', 'Average Speed'],
    ['秒/个', 'sec/bubble'],
    ['最高连击', 'Max Combo'],
    ['连续', 'combo'],
    ['太棒了！你的表现很出色！', 'Great job! Excellent performance!'],
    ['播放', 'Play'],
    ['重玩', 'Play Again'],
    ['结束', 'Finish'],
    ['Export Session Report', 'Export Session Report'],
    ['行为模式分析', 'Behavior Pattern Analysis'],
    ['点击轨迹', 'Click Trail'],
    ['模式识别', 'Pattern Recognition'],
    ['等待游戏数据...', 'Waiting for game data...'],
    ['分析中...', 'Analyzing...'],
  ]);
  let out = html;
  for (const [cn, en] of map.entries()) {
    out = out.replace(new RegExp(cn, 'g'), en);
  }
  return out;
}

function processFile(file) {
  const ext = path.extname(file);
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  content = removeChineseComments(content, ext);
  if (path.basename(file) === 'index.html') {
    content = replaceIndexTexts(content);
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
}

function walk(dir, filterExts) {
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, filterExts);
    else if (filterExts.includes(path.extname(p))) processFile(p);
  }
}

const root = path.resolve(__dirname, '..');
walk(path.join(root, 'src', 'frontend'), ['.js', '.css', '.html']);
console.log('Paper EN sanitization complete');
