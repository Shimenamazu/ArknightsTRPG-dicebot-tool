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

  for (const i in channels) {
    const panel = document.createElement("div");
    panel.classList.add("channel-panel");
    const label = document.createElement("label");
    const cb = document.createElement("input");
    panel.classList.add("channel-panel");
    cb.type = "checkbox";
    cb.value = i;
    cb.classList.add("channel-btn");
    cb.checked = true;
    label.appendChild(cb);
    label.append(channels[i]);
    panel.appendChild(label);
    channel_list.appendChild(panel);
  }

  //内容変更
  selected_file.textContent = file.name;
  chara_list.textContent = "未確認";
  checker_area.textContent = "未集計";
}

//変更ボタン
change_button.addEventListener("click", () => {
  document.querySelectorAll(".sort").forEach((s) => (s.textContent = "-"));
  drop_area.classList.remove("hidden");
  selected_file.classList.add("hidden");
  change_button.classList.add("hidden");
  channel_list.textContent = "";
  overall_p.classList.add("hidden");
});

let sort_type = "name";
let sort_desc = true;
let sort_arrow = "↑";

//集計ボタン
start_button.addEventListener("click", () => {
  const selected = [...document.querySelectorAll(".channel-btn:checked")].map(
    (cb) => channels[cb.value],
  );

  checker(selected);
});

let charas = [];
let rolls = {};
class Stat {
  constructor(name) {
    this.name = name;
    this.sr = [0, 0, 0, 0, 0];
    charas.push(name);
  }

  cal_p() {
    this.p = [
      0,
      ((this.sr[1] / this.sr[0]) * 100).toFixed(1),
      ((this.sr[2] / this.sr[0]) * 100).toFixed(1),
      ((this.sr[3] / this.sr[0]) * 100).toFixed(1),
      ((this.sr[4] / this.sr[0]) * 100).toFixed(1),
    ];
  }
}

//集計
function checker(cond_c) {
  charas = [];
  rolls = {};
  sort_type = "name";
  sort_desc = true;
  const targets = text_log.filter((t) => cond_c.includes(t[0]));
  chara_list.textContent = "";
  const g_dice = document.getElementById("g-dice").checked;

  document.querySelectorAll(".sort").forEach((s) => (s.textContent = "-"));

  targets.forEach((e) => {
    //console.log(e[1] + ":" + e[2]);
    const check1 = [
      ...e[2].matchAll(/\((\d+)?AD(100)?\<\=(\d+)\) ＞ (\d+) ＞/g),
    ];
    if (check1) {
      check1.forEach((r) =>
        pushchara(e[1], 1, 3 - is_suc(Number(r[3]), Number(r[4]))),
      );
    }

    if (g_dice) {
      const check2 = [...e[2].matchAll(/\((1)?D100\<\=(\d+)\) ＞ (\d+) ＞/g)];
      if (check2) {
        check2.forEach((r) =>
          pushchara(e[1], 1, 3 - is_suc(Number(r[2]), Number(r[3]))),
        );
      }
    }
  });

  if (charas.length > 0) {
    for (const i in charas) {
      const panel = document.createElement("div");
      panel.classList.add("chara-panel");
      const label = document.createElement("label");
      const cb = document.createElement("input");
      panel.classList.add("chara-panel");
      cb.type = "checkbox";
      cb.value = i;
      cb.classList.add("chara-btn");
      cb.checked = true;
      cb.addEventListener("change", show_result);
      label.appendChild(cb);
      label.append(charas[i]);
      panel.appendChild(label);
      chara_list.appendChild(panel);

      show_result();
    }
  } else {
    chara_list.textContent = "-";
    checker_area.textContent = "該当無し";
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
    if (roll <= 10) {
      return 2;
    }
    if (document.getElementById("p-cri").checked && tar == roll) {
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

function show_result() {
  checker_area.textContent = "";
  const tar_chara = [...document.querySelectorAll(".chara-btn:checked")].map(
    (cb) => charas[cb.value],
  );
  const array = Object.values(rolls);

  array.sort((a, b) => {
    let v1;
    let v2;

    switch (sort_type) {
      case "name":
        v1 = b.name;
        v2 = a.name;
        document.getElementById("s-1").textContent = sort_arrow;
        break;

      case "roll":
        v1 = a.sr[0];
        v2 = b.sr[0];
        document.getElementById("s-2").textContent = sort_arrow;
        break;

      case "cri":
        v1 = a.p[1];
        v2 = b.p[1];
        document.getElementById("s-3").textContent = sort_arrow;
        break;

      case "suc":
        v1 = a.p[2];
        v2 = b.p[2];
        document.getElementById("s-4").textContent = sort_arrow;
        break;

      case "fail":
        v1 = a.p[3];
        v2 = b.p[3];
        document.getElementById("s-5").textContent = sort_arrow;
        break;

      case "err":
        v1 = a.p[4];
        v2 = b.p[4];
        document.getElementById("s-6").textContent = sort_arrow;
        break;
    }

    if (v1 < v2) return sort_desc ? 1 : -1;
    if (v1 > v2) return sort_desc ? -1 : 1;
    return 0;
  });

  for (const r of array) {
    if (tar_chara.includes(r.name)) {
      r.cal_p();

      const panel = document.createElement("div");
      panel.classList.add("result-panel");
      const span1 = document.createElement("span");
      span1.classList.add("rp-1");
      span1.textContent = r.name;
      const span2 = document.createElement("span");
      span2.classList.add("rp-2");
      span2.textContent = r.sr[0] + "回";
      const span3 = document.createElement("span");
      span3.classList.add("rp-3");
      span3.textContent = r.sr[1] + "回(" + r.p[1] + "%)";
      const span4 = document.createElement("span");
      span4.classList.add("rp-4");
      span4.textContent = r.sr[2] + "回(" + r.p[2] + "%)";
      const span5 = document.createElement("span");
      span5.classList.add("rp-5");
      span5.textContent = r.sr[3] + "回(" + r.p[3] + "%)";
      const span6 = document.createElement("span");
      span6.classList.add("rp-6");
      span6.textContent = r.sr[4] + "回(" + r.p[4] + "%)";
      panel.appendChild(span1);
      panel.appendChild(span2);
      panel.appendChild(span3);
      panel.appendChild(span4);
      panel.appendChild(span5);
      panel.appendChild(span6);
      checker_area.appendChild(panel);
    }
  }
}

function setSort(type) {
  if (sort_type === type) {
    console.log("t = n_t");
    sort_desc = !sort_desc;
  } else {
    sort_type = type;
    sort_desc = true;
  }

  if (sort_desc) {
    sort_arrow = "↑";
  } else {
    sort_arrow = "↓";
  }

  document.querySelectorAll(".sort").forEach((s) => (s.textContent = "-"));

  show_result();
}
