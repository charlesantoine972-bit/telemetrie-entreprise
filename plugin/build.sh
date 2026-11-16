#!/bin/sh
# Compile le plugin Windows 64 bits (depuis Linux avec mingw-w64).
set -e
cd "$(dirname "$0")"
x86_64-w64-mingw32-g++ -O2 -shared -std=c++17 -Wall \
  -I scs_sdk/include telemetrie_entreprise.cpp exports.def \
  -static -static-libgcc -static-libstdc++ -lws2_32 \
  -s -o ../resources/plugin/telemetrie_entreprise.dll
