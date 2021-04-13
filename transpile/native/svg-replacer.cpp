#include <iostream>
#include <string>
#include <napi.h>
#include "./native.hpp"
#include "./utils.hpp"

Napi::Promise replaceInFileAsync(const Napi::CallbackInfo &info) {
    Napi::Promise::Deferred deferred = Promise::Deferred::New(env);
    return deferred.Promise();
}
