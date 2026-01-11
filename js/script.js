const soundShake = document.getElementById("soundShake")
const soundWin2 = document.getElementById("soundWin2")
const soundWin3 = document.getElementById("soundWin3")

const animals=["Hươu","Bầu","Gà","Cá","Cua","Tôm"]
const pos=["0% 0%","50% 0%","100% 0%","0% 100%","50% 100%","100% 100%"]
let rolling = false
let rollTimer = null
let cfg=JSON.parse(localStorage.getItem("cfg")||"{}")
let stats=JSON.parse(localStorage.getItem("stats")||"[0,0,0,0,0,0]")

function setDice(el,i){el.style.backgroundPosition=pos[i]}

function weightedRandom(){
  let pool=[]
  for(let i=0;i<6;i++){
    let w=cfg[i]||0
    for(let j=0;j<w;j++) pool.push(i)
  }
  if(pool.length && Math.random()<0.6)
    return pool[Math.floor(Math.random()*pool.length)]
  return Math.floor(Math.random()*6)
}
function fakeRoll(){
  for(let i=1;i<=3;i++){
    let el = document.getElementById("d"+i)
    el.classList.add("rolling")
    let r = Math.floor(Math.random()*6)
    setDice(el, r)
  }
}
function checkBonus(res){
  let counts = {}
  res.forEach(r => counts[r] = (counts[r]||0)+1)

  let max = Math.max(...Object.values(counts))

  // reset hiệu ứng cũ
  document.querySelectorAll(".dice").forEach(d=>{
    d.classList.remove("boom2","boom3")
  })

  if(max===3){
    document.querySelectorAll(".dice").forEach(d=>{
      d.classList.add("boom3")
      setTimeout(()=>d.classList.remove("boom3"),700)
    })
    return 3
  }

  if(max===2){
    document.querySelectorAll(".dice").forEach(d=>{
      d.classList.add("boom2")
      setTimeout(()=>d.classList.remove("boom2"),500)
    })
    return 2
  }

  return 1
}


function roll(){
  soundWin2.pause()
  soundWin3.pause()

  if(rolling) return
  rolling = true
  // ▶️ bật âm thanh lắc
  soundShake.currentTime = 0
  soundShake.play()

  result.innerText = "🎲 Đang lắc..."

  // ⏱ chạy random giả mỗi 100ms
  rollTimer = setInterval(fakeRoll, 100)
  

  // 🛑 sau 6 giây thì dừng và ra kết quả thật
  setTimeout(()=>{
	// ⏹️ dừng âm thanh lắc ĐÚNG LÚC
	soundShake.pause()
	soundShake.currentTime = 0
	
	document.querySelectorAll(".dice")
	.forEach(d=>d.classList.remove("rolling"))
    clearInterval(rollTimer)
	

    let res=[]
    for(let i=1;i<=3;i++){
      let r = weightedRandom()
      stats[r]++
      setDice(document.getElementById("d"+i), r)
      res.push(animals[r])
    }
	// 💥 nếu trùng 3 con
	if(res[0]===res[1] && res[1]===res[2]){
	  document.querySelectorAll(".dice").forEach(d=>{
		d.classList.add("boom")
		setTimeout(()=>d.classList.remove("boom"),600)
	  })

	  result.innerText += " 🎉 TRÙNG 3!"
	}
	


    localStorage.setItem("stats", JSON.stringify(stats))
    result.innerText = "Kết quả: " + res.join(" • ")
	// 🔥 tính thưởng
	let bonus = checkBonus(res)
	addHistory(res, bonus)
	// 🔊 âm thanh thưởng
	if(bonus === 2){
	  soundWin2.currentTime = 0
	  soundWin2.play()
	}
	if(bonus === 3){
	  soundWin3.currentTime = 0
	  soundWin3.play()
	}
    // 💰 hiển thị thưởng
	if(bonus>1){
	  result.innerText += ` 💰 THƯỞNG NHÂN ${bonus}`
	  
	}
	
    // cập nhật thống kê nếu admin đang mở
    if(admin.style.display==="flex"){
      statsBox()
    }

    rolling = false
  }, 1000)
}



function openAdmin(){
  admin.style.display="flex"
  render()
}

function closeAdmin(){admin.style.display="none"}

function render(){
  list.innerHTML=""
  animals.forEach((a,i)=>{
    list.innerHTML+=`
      <div class="row">
        <div>${a}</div>
        <input type="number" min="0" value="${cfg[i]||0}" 
          onchange="cfg[${i}]=+this.value">
      </div>`
  })
  statsBox()
}

function save(){
  localStorage.setItem("cfg",JSON.stringify(cfg))
  alert("Đã lưu cấu hình")
}

function equalize(){
  animals.forEach((_,i)=>cfg[i]=10)
  render()
}

function statsBox(){
  let total = stats.reduce((a,b)=>a+b,0) || 1
  let max = Math.max(...stats)

  let html = `
  <tr>
    <th>Phần</th>
    <th>% cấu hình</th>
    <th>Lượt</th>
    <th>% thực tế</th>
  </tr>`

  animals.forEach((a,i)=>{
    let cfgPercent = cfg[i] ? cfg[i]+"%" : "0%"
    let realPercent = ((stats[i]/total)*100).toFixed(2)+"%"
    let hot = stats[i]===max && max>0 ? "class='hot'" : ""

    html+=`
    <tr ${hot}>
      <td>${a}</td>
      <td>${cfgPercent}</td>
      <td>${stats[i]}</td>
      <td>${realPercent}</td>
    </tr>`
  })

  html+=`
  <tr style="font-weight:bold">
    <td>Tổng</td>
    <td>100%</td>
    <td>${total}</td>
    <td>100%</td>
  </tr>`

  document.getElementById("statsTable").innerHTML = html
}




function resetStats(){
  stats=[0,0,0,0,0,0]
  localStorage.setItem("stats",JSON.stringify(stats))
  render()

}
/* ===== LỊCH SỬ PHIÊN ===== */
let historyData = JSON.parse(localStorage.getItem("history") || "[]")

function addHistory(res, bonus){
  const time = new Date().toLocaleTimeString("vi-VN")
  historyData.unshift({
    time,
    res: [...res],
    bonus
  })

  if(historyData.length > 20) historyData.pop() // giới hạn 20 phiên

  localStorage.setItem("history", JSON.stringify(historyData))
  renderHistory()
}

function renderHistory(){
  const box = document.getElementById("historyList")
  if(!box) return

  box.innerHTML = ""

  historyData.forEach(h=>{
    const div = document.createElement("div")
    div.className = "history-item" + (h.bonus===2?" win2":h.bonus===3?" win3":"")
    div.innerHTML = `
      <div>
        🎲 ${h.res.join(" • ")}
        ${h.bonus>1 ? `💰 x${h.bonus}` : ""}
      </div>
      <div class="history-time">${h.time}</div>
    `
    box.appendChild(div)
  })
}

function clearHistory(){
  if(!confirm("Xóa toàn bộ lịch sử?")) return
  historyData = []
  localStorage.removeItem("history")
  renderHistory()
}

/* load khi mở app */
renderHistory()

