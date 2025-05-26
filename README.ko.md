# Summer

FastAPI 기반 프로젝트를 빠르게 구성할 수 있는 템플릿입니다.

Summer에서는 [summer-toolkit](https://github.com/intotherealworld/summer-toolkit)에 있는 몇가지 유용한 모듈을 사용합니다.
- RouterScanner: APIRouter를 포함한 파일을 정해진 규칙으로 생성하면, 자동으로 등록해 줍니다. 
- SimpleJinja2Templates: Jinja2Templates를 사용할 때 템플릿의 절대 경로를 지정해 줘야 하는데, 이 모듈은 템플릿 디렉토리 이름만 지정하면 자동으로 절대경로를 찾아 설정해 줍니다.
- Environment: 속성 파일과 배포 단계를 관리하는 유틸리티 클래스입니다. 배포 단계별로 나누어서 속성을 관리할 수 있습니다.

## 사용 방법
```
> git clone https://github.com/intotherealworld/summer.git
> cd summer
> pip install -r requirements.txt
> python local_server.py
```

### 자신의 프로젝트 이름 적용 방법

#### 1. 디렉토리 이름 변경
```
> git clone https://github.com/intotherealworld/summer.git
> mv summer your_project_name
> cd your_project_name
> rm -rf .git
> mv summer your_project_name
```

#### 2. Dockerfile에 있는 프로젝트 이름 변경
```dockerfile
# change "summer" to your project name
ARG SUMMER_PROJECT_NAME="summer"
```

#### 3. properties.yml에 프로젝트 관련 정보 적용
```yaml
# do not change this key "summer".
# just change the series of "your_" below.
summer:
  project-name: "your_project_name"
  docs:
    title: "your_project_name"
    description: "your_project_description"
    version: "your_project_version"
```

Docker
```commandline
> docker build -t summer -f ./deploymemt/Dockerfile .
> docker run -p 5000:5000 --name summer summer
```

## 모듈 (in summer-toolkit)
### RouterScanner
파일이름 규칙:
```
# "router" 부분도 원하는 대로 설정 가능합니다.
*_router.py
```
코딩 규칙
```
# * 부분이 같아야 합니다.
*_router = APIRouter(tags=...)
```
예
```
root_router.py

root_router = APIRouter(tags=['root'])
```

### SimpleJinja2Templates
```
# 템플릿 디렉토리 이름 'templates'인 경우에는 다음과 사용합니다.
templates = SimpleJinja2Templates()

# 원하는 템플릿 디렉토리 이름을 지정할 수 있습니다.
templates = SimpleJinja2Templates(directory='directory_name')
```
예
> [root_router.py](https://github.com/intotherealworld/summer/blob/main/summer/root_router.py) 를 참고하세요.

### Environment
```
env = Environment()
title = env.get_props('summer.docs.title')
```
배포 단계 설정
```
# 환경변수
SUMMER_DEPLOYMENT_PHASE=your_phase

# 환경변수로 지정한 값과 파일이름의 - 뒷 부분이 같아야 합니다.
properties-your_phase.yml
```
'SUMMER_DEPLOYMENT_PHASE' 환경변수가 없는 경우 기본 파일인 properties.yml만 사용됩니다. 환경변수가 설정되는 경우 기본 파일과 배포 단계 속성 파일이 병합됩니다. 두 개의 파일에 같은 속성 이름이 있는 경우 배포 단계 파일이 기본 파일의 값을 덮어 씁니다.

### local_server.py
uvicorn 실행을 위한 도움 파일입니다.
> python local_server.py