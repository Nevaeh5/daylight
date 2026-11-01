import { useEffect, useState } from "react";
import type { Data } from "../../domain/tasks";
import { quoteFor, type PetAction } from "./companion";
export default function PixelRoom({
  today,
  pet,
  feedback,
  onInteract,
}: {
  today: string;
  pet?: Data["pet"];
  feedback?: { id: number; message: string };
  onInteract: (action: PetAction) => boolean;
}) {
  const [wave, setWave] = useState(false),
    [step, setStep] = useState(0),
    [speech, setSpeech] = useState("");
  useEffect(() => {
    setStep(0);
    setSpeech("");
  }, [today]);
  useEffect(() => {
    if (feedback) {
      setSpeech(feedback.message);
      setWave(true);
    }
  }, [feedback]);
  useEffect(() => {
    if (!wave) return;
    const t = setTimeout(() => setWave(false), 1200);
    return () => clearTimeout(t);
  }, [wave]);
  function talk(action: PetAction) {
    if (!onInteract(action)) return;
    setStep((v) => v + 1);
    setWave(true);
    setSpeech(
      action === "feed"
        ? pet?.fedOn === today
          ? "今天的小饼干已经收到啦，陪我聊聊天吧。"
          : "咔嚓！谢谢你的小饼干，心里暖暖的。"
        : action === "play"
          ? "一、二、三，伸个懒腰！一起给自己充充电。"
          : "摸摸头！被你惦记着，真好。",
    );
  }

  return (
    <>
      <section
        className={`room ${wave ? "pet-happy" : ""}`}
        aria-label="小狗小光的像素房间"
      >
        <div className="room-caption">
          <span className="eyebrow">DAYLIGHT · 小光的小屋</span>
          <h2>慢慢来，也会闪闪发光。</h2>
          <p>小光在这里，陪你把日子过成喜欢的样子。</p>
        </div>
        <div className="room-badge">
          <i /> 小光正在陪伴你
        </div>
        <svg
          className="room-art"
          viewBox="0 0 760 270"
          shapeRendering="crispEdges"
          role="img"
          aria-label="阳光洒进房间，小白狗坐在绿色地毯上"
        >
          <defs>
            <pattern
              id="floor"
              width="76"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path d="M0 31h76M1 0v31" stroke="#d7a4b6" strokeWidth="1" />
            </pattern>
          </defs>
          <path fill="#f9d9e4" d="M0 0h760v270H0z" />
          <path fill="#ffeef5" d="M0 15h760v3H0zM0 173h760v3H0z" />
          <path fill="#edc3cd" d="M0 189h760v81H0z" />
          <path fill="url(#floor)" d="M0 196h760v74H0z" />
          <path fill="#c889a1" d="M0 185h760v5H0z" />
          <path fill="#fff0d7" d="m425 100 90 30 119 140H383z" opacity=".7" />
          <path fill="#bf8da1" d="M487 27h112v124H487z" />
          <path fill="#fff6ef" d="M493 33h100v110H493z" />
          <path fill="#bed7e1" d="M499 39h88v98H499z" />
          <path
            fill="#f7f7e9"
            d="M505 64h20v-6h20v6h12v10h-52zM551 103h15v-6h21v19h-36z"
          />
          <path fill="#f6d69a" d="M561 46h14v14h-14z" />
          <path
            fill="#fff6ef"
            d="M539 36h6v104h-6zM496 86h94v6h-94zM481 143h126v8H481z"
          />
          <path fill="#e5a5bb" d="M476 23h9v116h-9zM600 23h9v116h-9z" />
          <path fill="#f9f5e7" d="M615 53h40v45h-40z" />
          <path fill="#bd829b" d="M620 58h30v35h-30z" />
          <path fill="#f3bccd" d="M624 62h22v27h-22z" />
          <path
            fill="#899878"
            d="M632 67h6v6h-6zM628 74h15v5h-15zM634 79h4v7h-4z"
          />
          <path
            fill="#c88c9c"
            d="M663 160h62v8h-62zM669 168h6v40h-6zM714 168h6v40h-6z"
          />
          <path fill="#e4a8b5" d="M687 133h24v27h-24z" />
          <path
            fill="#7d9876"
            d="M696 109h7v26h-7zM685 114h12v14h-12zM702 102h11v20h-11zM710 119h9v10h-9z"
          />
          <path
            fill="#e8adc2"
            d="M365 215h164v6h18v22h-18v7H365v-7h-18v-22h18z"
          />
          <path fill="#d58ca8" d="M369 222h156v20H369z" />
          <path fill="#f4d0dc" d="M383 227h128v3H383zM383 234h128v3H383z" />
          <path
            fill="#dd9eae"
            d="M229 176h93v7h-93zM236 183h7v37h-7zM308 183h7v37h-7z"
          />
          <path fill="#ca819e" d="M242 159h31v17h-31z" />
          <path fill="#f7edda" d="M247 155h22v18h-22z" />
          <path fill="#a7bc99" d="M286 167h22v9h-22zM290 163h18v4h-18z" />
          <g aria-hidden="true">
            <path fill="#be829a" d="M142 131h45v6h-45zM146 137h37v48h-37z" />
            <path fill="#fff1e9" d="M150 143h29v17h-29zM150 166h29v13h-29z" />
            <path fill="#dd92b0" d="M153 145h6v13h-6zM163 147h5v11h-5z" />
            <path fill="#abbf9d" d="M170 144h5v14h-5z" />
            <path fill="#e5bca6" d="M155 169h19v7h-19z" />
            <path fill="#c984a2" d="M625 31h4v25h-4zM614 56h26v5h-26z" />
            <path
              fill="#b8c79d"
              d="M620 44h5v13h-5zM625 41h5v16h-5zM630 47h5v10h-5z"
            />
            <path fill="#e29bb8" d="M617 40h9v7h-9zM627 36h9v8h-9z" />
            <path fill="#fff1cb" d="M620 42h3v3h-3zM630 38h3v3h-3z" />
            <path fill="#fff2f7" d="M515 208h28v5h5v12h-38v-12h5z" />
            <path fill="#d491ae" d="M519 215h20v7h-20z" />
          </g>
          <g className="pixel-dog">
            <ellipse
              cx="444"
              cy="228"
              rx="32"
              ry="5"
              fill="#879879"
              opacity=".35"
            />
            <path
              fill="#b9a485"
              d="M417 177h9v-12h36v12h9v42h-8v9h-38v-8h-8z"
            />
            <path
              fill="#fff9e7"
              d="M422 176h10v-7h25v7h9v39h-7v10h-29v-10h-8z"
            />
            <path fill="#d5bd96" d="M416 176h11v23h-11zM461 176h11v23h-11z" />
            <g className="dog-eyes">
              <path fill="#615b4d" d="M433 187h4v5h-4zM453 187h4v5h-4z" />
            </g>
            <path
              fill="#7f6b55"
              d="M442 195h6v4h-6zM444 199h2v4h-2zM439 202h5v2h-5zM446 202h5v2h-5z"
            />
            <path fill="#ecc3a6" d="M428 196h7v3h-7zM455 196h7v3h-7z" />
            <path fill="#dcc7a4" d="M436 214h3v11h-3zM451 214h3v11h-3z" />
            <path fill="#dc8bac" d="M432 208h26v5h-26z" />
            <path fill="#f4bf88" d="M443 211h5v5h-5z" />
          </g>
          <path
            fill="#b09a79"
            d="M66 151h51v5H66zM72 156h6v47h-6zM106 156h6v47h-6z"
          />
          <path fill="#d1b183" d="M77 137h28v14H77z" />
          <path
            fill="#8da37e"
            d="M87 111h7v27h-7zM75 116h13v12H75zM94 108h12v18H94z"
          />
        </svg>
        <button
          className={`pet-target ${wave ? "wave" : ""}`}
          aria-label="和小光打招呼"
          onClick={() => {
            setStep((v) => v + 1);
            setSpeech("");
            setWave(true);
          }}
        >
          <span className="pet-bubble">
            {wave ? "汪！喜欢和你在一起 ♡" : "点点我，听一句悄悄话 ♡"}
          </span>
        </button>
        <span className="room-label">♥ 生活经营中 · 慢慢长大</span>
      </section>
      <section className="pet-console" aria-label="小光陪伴互动">
        <div className="pet-dialogue">
          <span className="pet-name">小光的每日一句</span>
          <p aria-live="polite">{speech || quoteFor(today, step)}</p>
          {speech && <small>{quoteFor(today, step)}</small>}
        </div>
        <div className="pet-actions">
          <button onClick={() => talk("pet")}>♡ 摸摸头</button>
          <button onClick={() => talk("feed")}>
            {pet?.fedOn === today ? "✓ 今日已喂" : "▦ 喂饼干"}
          </button>
          <button onClick={() => talk("play")}>✦ 伸懒腰</button>
          <span>陪伴 {pet?.bond || 0}/5</span>
        </div>
      </section>
    </>
  );
}
