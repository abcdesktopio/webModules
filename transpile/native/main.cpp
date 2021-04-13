#include <napi.h>
#include "./native.hpp"

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("replaceInFileAsync", Napi::Function::New(env, replaceInFileAsync));
  return exports;
}

NODE_API_MODULE(transpilenative, Init)