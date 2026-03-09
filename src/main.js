const reader = new FileReader();
const parser = new DOMParser();
const drop_area = document.getElementById("drop-area");
const file_input = document.getElementById("file-input");
const selected_file = document.getElementById("selected-file");
const change_button = document.getElementById("change-button");
const start_button = document.getElementById("start-button");
const checker_area = document.getElementById("checker-area");
const channel_list = document.getElementById("channel-list");

let text_log = [];

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

// 共通処理
async function handleFiles(file) {
  console.log(file.name);

  //HTMLに限定
  if (!file.name.endsWith(".html")) {
    alert("HTMLファイルを選択してください");
    checker_area.classList.add("hidden");
    return;
  }

  const text = await file.text();

  //ココフォリアに限定
  if (!text.includes("<title>ccfolia - logs</title>")) {
    alert("ココフォリアのログを選択してください");
    checker_area.classList.add("hidden");
    return;
  }

  //各種非表示
  drop_area.classList.add("hidden");
  selected_file.classList.remove("hidden");
  start_button.classList.remove("hidden");
  change_button.classList.remove("hidden");
  checker_area.classList.remove("hidden");

  //テキスト抽出
  const doc = parser.parseFromString(text, "text/html");
  const ps = doc.querySelectorAll("p");
  text_log = [];
  let channels = [];

  ps.forEach((p) => {
    const spans = p.querySelectorAll("span");
    const channel = spans[0].textContent.trim().match(/\[(.+?)\]/)[1];
    const name = spans[1].textContent.trim();
    const mes = spans[2].textContent.trim();
    channels.push(channel);
    text_log.push([channel, name, mes]);
  });

  channels = [...new Set(channels)];

  //内容変更
  selected_file.textContent = file.name;
  channel_list.textContent = channels;
  checker_area.textContent = "";
}

//変更ボタン
change_button.addEventListener("click", () => {
  drop_area.classList.remove("hidden");
  selected_file.classList.add("hidden");
  start_button.classList.add("hidden");
  change_button.classList.add("hidden");
  checker_area.classList.add("hidden");
});

//集計ボタン
start_button.addEventListener("click", () => {
  checker();
});

//集計
function checker() {
  let result = "";
  text_log.forEach((e) => {
    result += e + "\n";
  });

  checker_area.textContent = result;
}
