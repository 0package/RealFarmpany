React Native 시작하기
1.Homebrew 설치
Homebrew는 Mac에서 필요한 패키지를 설치하고 관리하는 Mac용 패키지 관리자이다.
명령어 한 줄로 프로그램을 설치/제거할 수 있기 때문에 Mac 사용자라면 꼭! 설치해야 한다.

1.Homebrew 설치
터미널에 아래 명령어를 입력해서 Homebrew를 설치한다.

/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
2.Homebrew 버전 확인
설치가 잘 되었다면 아래의 명령어를 통해 Homebrew의 버전을 확인할 수 있다.

brew --version


❗️ zsh: command not found: brew 에러가 뜨는 경우

Homebrew가 /usr/local/... 가 아닌 /opt/homebrew/ 에 설정되어 있어서 그렇다고 한다.

해결 방법
.zshrc 파일을 vi로 열어준다.
vi ~/.zshrc
환경 변수 설정을 위해 아래의 코드를 작성 후 저장한다.
// M1 칩인 경우
export PATH=/opt/homebrew/bin:$PATH

// M1 칩이 아닌 경우
export PATH=/usr/local/bin:/usr/local/sbin:$PATH
이후 코드 적용을 해주면 된다.
source ~/.zshrc
2.Node.js 설치
1. Node.js 설치
React Native는 Javascript의 언어로 된 프레임워크라서 Javascript의 런타임인 Node.js가 필요하다.

brew로 깔아주면 된다.

brew install node
2. Node.js 버전 확인
잘 깔리면 버전이 나온다.

npm --version


3.Watchman 설치
React Native에서는 디버그 모드에서 소스코드의 추가, 변경이 발생하면 hot-reload를 하기 위해 Watchman을 사용하고 있다.

Watchman은 특정 폴더나 파일을 감시하다가 변화가 생기면, 특정 동작을 실행하도록 설정하는 역할을 한다.

1. Watchman 설치
brew로 Watchman을 설치해준다.

brew install watchman
2. Watchman 버전 확인
Watchman이 잘 설치되었다면, 아래 명령어를 통해 버전을 확인할 수 있다.

watchman --version


4.Xcode 설치
React Native로 iOS 앱을 개발하기 위해서는 iOS 개발 툴인 Xcode가 필요하다.
Xcode는 iOS를 위한 앱을 만들 수 있는 공식 통합 개발 환경(IDE)이다.

설치하는데 오래 걸리니 미리미리 깔아두자.

1. Xcode 설치
아래 링크를 통해 Xcode를 다운로드한다.

https://apps.apple.com/us/app/xcode/id497799835?mt=12

2. Command Line Tools 설정
Xcode > Settings > Locations에서 가장 최신의 Command Line Tools를 선택해준다.


3. Cocoapods 설치
Cocoapods는 React Native로 iOS 앱을 개발하려면 꼭 필요한 의존성 관리자이다.

1. Cocoapaods 설치
터미널에 아래 명령어를 입력해서 Cocoapods를 설치한다.

sudo gem install cocoapods
2. Cocoapods 버전 확인
Cocoapods가 잘 설치되었다면, 아래의 명령어를 통해 Cocoapods의 버전을 확인할 수 있다.

pod --version


5.JDK 설치
React Native로 Android 앱을 개발하기 위해서는 JDK(Java Development Kit)가 필요하다.
jdk는 자바 애플리케이션을 구축하기 위한 핵심 플랫폼 구성요소이다.

처음에 jdk8로 받았는데 리액트 네이티브 공식 홈페이지에서 jdk11을 권장한다길래 그걸로 바꿨다.



1. JDK 설치
brew로 JDK를 설치한다.

brew tap AdoptOpenJDK/openjdk
brew install --cask adoptopenjdk11
2. Java 버전 확인
JDK를 통해 Java가 잘 설치됐으면 아래의 명령어를 통해 Java의 버전을 확인할 수 있다.

java -version


6.Android Studio 설치
React Native로 Android 앱을 개발하기 위해서는 Android 개발 툴인 Android Studio가 필요하다.
Android Studio는 Android를 위한 앱을 만들 수 있는 공식 통합 개발 환경(IDE)이다.

1. Android Studio 설치
아래의 링크를 통해 Android Studio를 다운로드 한다.
https://developer.android.com/studio

2. SDK 설정
Android Studio 설치가 완료되면, SDK를 설정해야 한다.



자신에게 필요한 API Level에 맞는 SDK Platform을 선택하여, 아래의 내용을 찾아 OK 버튼을 누르면 된다.

나는 31버전을 골랐다.

Android SDK Platform 30
Intel x86 Atom System Image
Google APIs Intel x86 Atom System Image
Google APIs Intel x86 Atom_64 System Image
이것들을 다운받으면 된다.



3. VDM 설정
Android Studio 설치가 완료되면, VDM(Virtual Device Manager)을 설정해야 한다.

Android Studio의 More Actions > Virtual Device Manager탭에서 Create device를 클릭한다.

Google Play Store의 표시가 있는 device를 선택하고(가장 최신의 device를 선택하면 됨), 아까 선택한 API Level에 맞는 System Image를 선택하면 된다.





선택한 AVD가 뜨고 Finish를 누르면 device가 생성된 걸 확인할 수 있다.

4. Android 환경 변수 설정
Android Studio를 환경 변수에 등록해 주어야 한다.

Android SDK 메뉴 상단에 있는 Android SDK Location의 위치를 복사한다.


터미널에 아래 명령어를 입력하여 파일을 열어서 수정하면 된다.

open ~/.zshrc
export ANDROID_HOME=복사한 자신의 안드로이드 SDK 위치
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

첨에 $ 안넣었다가 zshrc 오류나서 다 날라가는 줄 알았다 😭

5. adb
안드로이드 SDK가 잘 설정되었다면, 아래의 명령어를 통해 Android의 버전을 확인할 수 있다.

7.React Native 프로젝트 생성 및 확인
대망의 마지막 프로젝트 생성 단계..!
사실 한번에 성공할거라고는 생각 안하는게 좋다. 😅

1. React Native 프로젝트 생성
처음에 글로벌로 CLI를 깔았었는데 TypeError: cli.init is not a function 에러가 나길래 전역으로 설치된 버전을 지우고 그냥 npx로 실행시켰다.

React Native에 내장된 명령줄 인터페이스를 사용하여 새 프로젝트를 생성한다.

npx react-native@latest init MyApp
지우는건 이걸로 지우면 된다.

npm uninstall -g react-native-cli @react-native-community/cli react-native
npm -g list
2. iOS에서 확인하기
아래 명령어로 프로젝트를 실행하여 simulator에서 잘 작동하는지 확인해보자.

npm run ios


야호~~

3. Android에서 확인하기
아래 명령어로 프로젝트를 실행하여 emulator에서 잘 작동하는지 확인해보자.

npm run android
