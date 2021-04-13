{
  "targets":[
    {
      "target_name":"transpilenative",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "include_dirs": [ "<!@(node -p \"require('node-addon-api').include_dir\")" ],
      "sources": [
        "./native/main.cpp"
      ]
    }
  ]
}