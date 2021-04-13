#include <iostream>
#include <string>
#include <napi.h>
#include "./native.hpp"
#include "./utils.hpp"

Napi::Promise replaceInFileAsync(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(env);
    return deferred.Promise();
}
