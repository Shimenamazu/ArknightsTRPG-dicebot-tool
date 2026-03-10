const reader = new FileReader();
const parser = new DOMParser();
const drop_area = document.getElementById("drop-area");
const file_input = document.getElementById("file-input");
const selected_file = document.getElementById("selected-file");
const change_button = document.getElementById("change-button");
const start_button = document.getElementById("start-button");
const checker_area = document.getElementById("checker-area");
const channel_list = document.getElementById("channel-list");
const chara_list = document.getElementById("chara-list");
const overall_p = document.getElementById("overall-p");

// クリック → ファイル選択
drop_area.addEventListener("click", () => {
  file_input.click();
});

// ファイル選択
file_input.addEventListener("change", (e) => {
  handleFiles(e.target.files[0]);
  file_input.value = "";
});

// ドラッグ許可
drop_area.addEventListener("dragover", (e) => {
  e.preventDefault();
});

// ドロップ
drop_area.addEventListener("drop", (e) => {
  e.preventDefault();
  handleFiles(e.dataTransfer.files[0]);
});

let text_log = [];
let channels = [];

// 共通処理
async function handleFiles(file) {
  console.log(file.name);

  //HTMLに限定
  if (!file.name.endsWith(".html")) {
    alert("HTMLファイルを選択してください");
    overall_p.classList.add("hidden");
    return;
  }

  const text = await file.text();

  //ココフォリアに限定
  if (!text.includes("<title>ccfolia - logs</title>")) {
    alert("ココフォリアのログを選択してください");
    overall_p.classList.add("hidden");
    return;
  }

  //各種非表示
  drop_area.classList.add("hidden");
  selected_file.classList.remove("hidden");
  change_button.classList.remove("hidden");
  overall_p.classList.remove("hidden");

  //テキスト抽出
  const doc = parser.parseFromString(text, "text/html");
  const ps = doc.querySelectorAll("p");

  //初期化
  text_log = [];
  channels = [];

  ps.forEach((p) => {
    const spans = p.querySelectorAll("span");
    const channel = spans[0].textContent.trim().match(/\[(.+?)\]/)[1];
    const name = spans[1].textContent.trim();
    const mes = spans[2].textContent.trim();
    if (!channels.includes(channel)) {
      channels.push(channel);
    }
    text_log.push([channel, name, mes]);
  });

  //内容変更
  selected_file.textContent = file.name;
  channel_list.textContent = channels;
  chara_list.textContent = "未確認";
  checker_area.textContent = "未集計";
}

//変更ボタン
change_button.addEventListener("click", () => {
  drop_area.classList.remove("hidden");
  selected_file.classList.add("hidden");
  change_button.classList.add("hidden");
  channel_list.textContent = "";
  overall_p.classList.add("hidden");
});

//集計ボタン
start_button.addEventListener("click", () => {
  checker(channels);
});

let charas = [];
let rolls = {};
class Stat {
  constructor(name) {
    this.name = name;
    this.sr = [0, 0, 0, 0, 0];
    charas.push(name);
  }
}

//集計
function checker(cond_c) {
  charas = [];
  rolls = {};
  const targets = text_log.filter((t) => cond_c.includes(t[0]));

  targets.forEach((e) => {
    console.log(e[1] + ":" + e[2]);
    const check1 = e[2].match(/\((\d+)?AD(100)?\<\=(\d+)\) ＞ (\d+) ＞/);
    if (check1) {
      pushchara(e[1], 1, 3 - is_suc(Number(check1[3]), Number(check1[4])));
    }
  });

  if (charas.length > 0) {
    chara_list.textContent = charas;
    let tmp = "";
    for (const e in rolls) {
      tmp += rolls[e].name + ":" + rolls[e].sr + "\n";
    }
    checker_area.textContent = tmp;
  } else {
    chara_list.textContent = "0";
    checker_area.textContent = "no";
  }
}

function pushchara(name, type, result) {
  if (!charas.includes(name)) {
    rolls[name] = new Stat(name);
  }

  const roller = rolls[name];

  switch (type) {
    case 1:
      roller.sr[0] += 1;
      roller.sr[result] += 1;
      break;
  }
}

function is_suc(tar, roll) {
  if (roll <= tar) {
    if (tar == roll || tar <= 10) {
      return 2;
    }
    return 1;
  } else {
    if (roll >= 91) {
      return -1;
    }
    return 0;
  }
}
