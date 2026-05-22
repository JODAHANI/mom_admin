#!/usr/bin/env bash
# 릴리즈 키스토어 생성 (한 번만 실행)
set -e
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
"$JAVA_HOME/bin/keytool" \
  -genkey -v \
  -keystore android/app/momstore-release.jks \
  -alias momstore \
  -keyalg RSA -keysize 2048 -validity 10000
