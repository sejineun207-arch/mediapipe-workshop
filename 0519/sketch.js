import { Tracker } from "../lib/tracker.js";
import { INDEX_TIP, WRIST, MIDDLE_KNUCKLE } from "../lib/landmarks.js";
import { drawVideo, videoFit, toCanvas, mapRange } from "../lib/utils.js";

const tracker = new Tracker({ face: false, hands: true });

let hands = [];
let video = null;
let handState = "OPEN"; // 현재 손의 상태: "OPEN" 또는 "CLOSED"
let particles = [];

tracker.onUpdate((d) => {
  hands = d.hands;
  video = d.video;
});

function setup() {
  createCanvas(windowWidth, windowHeight);
  tracker.start();
  noStroke();
  textAlign(CENTER, CENTER);
}

function draw() {
  background(10);
  
  // 1. 비디오 그리기
  if (video) {
    drawVideo(video, drawingContext, width, height);
  }

  const fit = videoFit(video, width, height);

  // 2. 손 인식 및 로직
  if (hands.length > 0) {
    const hand = hands[0];
    const currentOpenness = hand.signals.openness;
    
    // 손이 완전히 닫혔는지, 완전히 펴졌는지 상태를 업데이트합니다.
    if (handState === "OPEN" && currentOpenness < 0.3) {
      handState = "CLOSED";
    } else if (handState === "CLOSED" && currentOpenness > 0.7) {
      handState = "OPEN";
      
      // 손 중앙 (중지 손가락의 관절) 위치 찾기
      const center = toCanvas(hand.point(MIDDLE_KNUCKLE), fit);
      
      // 불꽃 이모지 파티클 생성
      spawnFireEmojis(center);
    }

    // 손가락 끝에 투명도 있는 원을 그려서 트래킹 상태 확인
    const tip = toCanvas(hand.point(INDEX_TIP), fit);
    fill(255, 255, 255, 100);
    circle(tip.x, tip.y, mapRange(currentOpenness, 0, 1, 10, 30));
  } else {
    // 화면에서 손이 사라지면 상태 초기화
    handState = "OPEN"; 
  }

  // 3. 파티클 업데이트 및 그리기
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    
    p.vy += p.gravity; // 중력 적용 (점점 아래로)
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    
    // 이모지 그리기
    textSize(p.size);
    // 수명에 따라 점점 투명해짐
    drawingContext.globalAlpha = mapRange(p.life, 0, p.maxLife, 0, 1);
    text(p.emoji, p.x, p.y);
    drawingContext.globalAlpha = 1.0;

    // 수명이 다한 파티클 제거
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function spawnFireEmojis(pos) {
  const count = 50; // 이모지 갯수
  for (let i = 0; i < count; i++) {
    let maxLife = random(40, 100);
    particles.push({
      x: pos.x,
      y: pos.y,
      emoji: "🔥",
      life: maxLife,
      maxLife: maxLife,
      size: random(20, 60),
      // 사방으로 뿜어져 나가는 속도
      vx: random(-15, 15),
      vy: random(-15, 5), // 위로 솟구치게
      gravity: 0.5 // 떨어지는 힘
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
