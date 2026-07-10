
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>화학 실험 시뮬레이션 - 인트로</title>
    <style>
        /* 🎨 스크롤이 가능하도록 전면 수정된 세련된 테마 디자인 */
        body {
            margin: 0;
            padding: 40px 0; /* 💡 위아래 여백을 주어 스크롤 시 여유 공간 확보 */
            font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f8fafc;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: calc(100vh - 80px); /* 💡 전체 화면 높이를 채우되 패딩 값 제외 */
            overflow-y: auto; /* 💡 내용이 길어지면 브라우저 자체에 스크롤바(내리기) 생성 */
        }

        .intro-container {
            text-align: center;
            background: rgba(30, 41, 59, 0.7);
            padding: 40px 50px;
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(16px);
            max-width: 650px;
            width: 90%;
            margin: auto; /* 💡 스크롤 환경에서 중앙 정렬 유지 */
            transform: translateY(0);
            animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .icon {
            font-size: 56px;
            margin-bottom: 15px;
            display: inline-block;
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }

        h1 {
            font-size: 28px;
            font-weight: 800;
            line-height: 1.4;
            margin: 0 0 12px 0;
            background: linear-gradient(to right, #38bdf8, #818cf8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            word-break: keep-all;
        }

        .subtitle {
            font-size: 16px;
            color: #94a3b8;
            font-weight: 500;
            margin-bottom: 30px;
            letter-spacing: 1px;
        }

        /* 💡 오차 원인 요약 카드 공간 */
        .reason-box {
            text-align: left;
            background: rgba(15, 23, 42, 0.5);
            padding: 18px 22px;
            border-radius: 16px;
            margin-bottom: 35px;
            border-left: 4px solid #38bdf8;
        }

        .reason-box p {
            margin: 10px 0;
            font-size: 14px;
            color: #cbd5e1;
            display: flex;
            align-items: center;
            line-height: 1.5;
        }

        .reason-box p::before {
            content: "•";
            color: #38bdf8;
            font-weight: bold;
            display: inline-block;
            width: 15px;
            font-size: 18px;
        }

        /* ➡️ 다음으로 넘어가기 버튼 */
        .start-btn {
            background: linear-gradient(90deg, #2563eb, #1d4ed8);
            color: white;
            border: none;
            padding: 14px 36px;
            font-size: 16px;
            font-weight: 700;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
            transition: all 0.2s ease-in-out;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .start-btn:hover {
            background: linear-gradient(90deg, #3b82f6, #2563eb);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6);
        }

        .start-btn:active {
            transform: translateY(0);
        }
    </style>
</head>
<body>

    <div class="intro-container">
        <div class="icon">🧪</div>
        
        <h1>화학 - 이론적 실험과 실제 실험이 다른 이유</h1>
        
        <div class="subtitle">20313 우승연</div>

        <div class="reason-box">
            <p>이론값과 실제값의 비교</p>
            <p>사용자가 직접 조작하여 하는 가상의 실험실</p>
            <p>오타가 있거나 과학적 오류가 있어도 눈감고 모른척</p>
        </div>

        <button class="start-btn" onclick="location.href='stage2.html'">
            실험 시작하기 ➡️
        </button>
    </div>

</body>
</html>
