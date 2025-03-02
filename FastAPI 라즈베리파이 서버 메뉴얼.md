# 제목 없음

[라즈베리파이 FastAPI 서버]
![logo](https://github.com/user-attachments/assets/00430350-f213-42f3-9d4b-6191016a17a3)

- 패키지 업데이트

sudo apt update && sudo apt upgrade -y

1. Python 및 pip 설치 (파이썬 설치가 필요한 경우)

sudo apt install –y python3-pip

pip3 install —upgrade pip

1. 가상환경 설정(선택 사항)

sudo apt install –y python3-venv # venv 패키지 설치

python3 –m venv fastapi_env # fastapi_env라는 가상환경 생성

source fastapi_env/bin/activate #가상환경 활성화

1. FastAPI 및 Uvicorn 설치

FastAPI : 비동기 웹 프레임 워크

Uvicorn : ASGI 서버 역할

pip install fastapi uvicorn

설치 확인

python –c “import fastapi: print(fastapi.__version__)”

1. FastAPI 실행 테스트

간단한 FastAPI 앱을 만들어 실행해보기

nano main.py

from fastapi import FastAPI

app = FastAPI()

@app.get(“/”)

def read_root():

return{“message”:“Hello, FastAPI on Raspberry Pi!”}

서버 실행

uvicorn main:app --host 0.0.0.0 --port 8000 —reload

라즈베리파이의 IP 주소 확인 후 브라우저에서 http://&라즈베리파이IP&:8000에 접속

접속 했을 때 {“message”: “Hello, FastAPI on Raspberry Pi!”}가 출력됨.

- * 지금까지 만든 FastAPI 서버는 로컬 서버 **

[서버 외부 접근 방식]

- 라우터 포트포워딩(직접 접속)

장점: 간단하고 무료

단점: 보안 이슈(공개된 IP 노출), ISP(인터넷 제공업체)에 따라 제한될 수 있음

1) 라즈베리파이 내부 IP 확인

hostname –I

2) 공유기에서 포트포워딩 설정

- 공유기 관리자 페이지 접속([http://192.168.1.1](http://192.168.1.1/) 등, 라우터마다 다름)
- 포트포워딩(Port Forwarding) 설정 메뉴로 이동
- 아래 정보 입력:

내부 IP: (라즈베리파이 IP)

내부 포트: (FastAPI 서버 포트)

외부 포트: 8000(또는 다른 포트)

프로토콜: TCP

저장 후 라우터 재부팅

3) 외부 IP 확인 후 접속 테스트

인터넷에서 현재 공인 IP를 확인

curl ifconfig.me

이제 외부에서 접속할 때 브라우저에서 http://<IP>:8000 입력

- * 추가 보안: FastAPI 서버를 실행할 때 —host 0.0.0.0으로 설정해야 외부에서 접속 가능 **

ufw 방화벽이 활성화되어 있다면 포트 열기

sudo ufw allow 8000/tcp

- Cloudflare Tunnel(무료&보안 강화)

장점: 포트포워딩 없이 안전하게 외부 접속 가능

단점: Cloudflare 계정 필요

1) Cloudflare 계정 생성

Cloudflare 사이트에서 무료 계정을 만든 후, 도메인 등록(없어도 가능)

2) Cloudflare Tunnel 설치

curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm -o cloudflared

chmod +x cloudflared

sudo mv cloudflared /usr/local/bin/

설치 확인:

bash

복사편집

cloudflared —version

3) FastAPI 터널 열기

cloudflared tunnel —url http://localhost:8000

실행하면 Cloudflare에서 제공하는 임시 도메인이 생성됨.

1. Ngrok 사용(빠르고 간편)

장점: 설정이 간단하고 빠름

단점: 무료 버전은 임시 URL만 제공됨

1) Ngrok 설치

wget https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-arm.tgz

tar -xvzf ngrok-stable-linux-arm.tgz

sudo mv ngrok /usr/local/bin/

2) Ngrok 실행

ngrok http 8000

실행하면 다음과 같은 URL이 생성됨:

nginx

Forwarding https://random-id.ngrok.io -& http://localhost:8000

이제 **https://random-id.ngrok.io** 로 외부에서 접속 가능!

- * Ngrok 무료 버전의 단점 : 생성되는 URL이 매번 바뀜(유료 버전 사용하면 고정 가능) **

| 방법 | 설정 난이도 | 보안 | 무료 여부 | 특징 |
| --- | --- | --- | --- | --- |
| 포트포워딩 | 보통 | 낮음(IP 노출) | O | 직접 서버 운영 |
| Cloudflare Tunnel | 쉬움 | 높음 | O | 포트 개방 없이 보안 강화 |
| Ngrok | 매우 쉬움 | 중간 | O | 빠른 테스트에 적합 |
- 단기테스트 -> Ngrok
- 보안 중요 -> Cloudflare Tunnel
- 직접 서버 운영 & 도메인 연결 -> 포트포워딩
