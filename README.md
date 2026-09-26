# webModules

## About this repository
webModules repository contains the HTML/JS files for the abcdesktop website.


## flowchart

abcdesktop’s web front end authenticates a user, redirects into a browser desktop, and connects that desktop to remote applications and services. The runtime includes a noVNC display/input layer, application launching, files, terminal, settings, notifications, and peripheral integrations. 

``` mermaid
---
config:
  theme: redux
---
flowchart TB
 subgraph group_access["Access"]
        node_login["Login Page<br>[base.js]"]
        node_auth["Authentication<br>[auth.js]"]
        node_jwt["JWT Handoff<br>[jwtstorage.js]"]
  end
 subgraph group_desktop["Desktop Runtime"]
        node_desktop_shell["Desktop Shell<br>[system.js]"]
        node_launcher["Session Launcher<br>[launcher.js]"]
        node_rfb["VNC Client<br>[rfb.js]"]
        node_display_input["Display Input<br>[display.js]"]
        node_app_selector["App Selector<br>[appSelector.js]"]
        node_app_store["App Store<br>[appstore.js]"]
  end
 subgraph group_services["Desktop Services"]
        node_file_workspace["File Workspace<br>[filerapiclient.js]"]
        node_web_shell["Web Shell<br>[webshell.js]"]
        node_settings["User Settings<br>[settings.js]"]
        node_notifications["Notifications"]
        node_remote_desktop[("Remote Desktop")]
  end
 subgraph group_peripherals["Peripherals"]
        node_microphone["Microphone Capture<br>[main.js]"]
        node_speaker["Speaker Playback<br>[main.js]"]
        node_printer["Printing<br>[printer.js]"]
        node_media_tools["Media Tools<br>[screenRecord.js]"]
  end
    node_user(("User")) -- opens --> node_login
    node_login -- submits credentials --> node_auth
    node_auth -- provides token --> node_jwt
    node_jwt -- redirects to desktop --> node_desktop_shell
    node_desktop_shell -- starts session --> node_launcher
    node_launcher -- connects session --> node_remote_desktop
    node_desktop_shell -- opens apps --> node_app_selector
    node_app_selector -- loads catalog --> node_app_store
    node_rfb -- renders and handles input --> node_display_input
    node_rfb -- speaks VNC --> node_remote_desktop
    node_desktop_shell -- opens files --> node_file_workspace
    node_desktop_shell -- opens terminal --> node_web_shell
    node_desktop_shell -- opens settings --> node_settings
    node_desktop_shell -- reports status --> node_notifications
    node_microphone -- checks PulseAudio --> node_launcher
    node_microphone -- streams microphone --> node_audio_gateway["Audio Gateway"]
    node_microphone -- reports errors --> node_notifications
    node_microphone -- checks availability --> node_pulse_audio[("Pulse Audio")]
    node_speaker -- checks PulseAudio --> node_launcher
    node_speaker -- receives audio --> node_audio_gateway
    node_speaker -- checks availability --> node_pulse_audio
    node_speaker -- reports errors --> node_notifications
    node_desktop_shell -. controls printing .-> node_printer
    node_desktop_shell -. controls recording .-> node_media_tools

     node_login:::toneBlue
     node_auth:::toneBlue
     node_jwt:::toneBlue
     node_desktop_shell:::toneAmber
     node_launcher:::toneAmber
     node_rfb:::toneAmber
     node_display_input:::toneAmber
     node_app_selector:::toneAmber
     node_app_store:::toneAmber
     node_file_workspace:::toneMint
     node_web_shell:::toneMint
     node_settings:::toneMint
     node_notifications:::toneMint
     node_remote_desktop:::toneMint
     node_microphone:::toneRose
     node_speaker:::toneRose
     node_printer:::toneRose
     node_media_tools:::toneRose
     node_user:::toneBlue
     node_pulse_audio:::toneAmber
     node_audio_gateway:::toneIndigo
    classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a
    classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554
    classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f
    classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
    classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337
    classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81
    classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a
    click node_login "https://github.com/abcdesktopio/webmodules/blob/4.4/identification/site/js/base.js"
    click node_auth "https://github.com/abcdesktopio/webmodules/blob/4.4/js/auth.js"
    click node_jwt "https://github.com/abcdesktopio/webmodules/blob/4.4/js/jwtstorage.js"
    click node_desktop_shell "https://github.com/abcdesktopio/webmodules/blob/4.4/js/system.js"
    click node_launcher "https://github.com/abcdesktopio/webmodules/blob/4.4/js/launcher.js"
    click node_rfb "https://github.com/abcdesktopio/webmodules/blob/4.4/js/noVNC/core/rfb.js"
    click node_display_input "https://github.com/abcdesktopio/webmodules/blob/4.4/js/noVNC/core/display.js"
    click node_app_selector "https://github.com/abcdesktopio/webmodules/blob/4.4/js/appSelector.js"
    click node_app_store "https://github.com/abcdesktopio/webmodules/blob/4.4/js/appstore.js"
    click node_file_workspace "https://github.com/abcdesktopio/webmodules/blob/4.4/js/filerapiclient.js"
    click node_web_shell "https://github.com/abcdesktopio/webmodules/blob/4.4/js/webshell.js"
    click node_settings "https://github.com/abcdesktopio/webmodules/blob/4.4/js/settings.js"
    click node_notifications "https://github.com/abcdesktopio/webmodules/blob/4.4/js/notificationsystem.js"
    click node_microphone "https://github.com/abcdesktopio/webmodules/blob/4.4/js/microphone/main.js"
    click node_speaker "https://github.com/abcdesktopio/webmodules/blob/4.4/js/speaker/main.js"
    click node_printer "https://github.com/abcdesktopio/webmodules/blob/4.4/js/printer.js"
    click node_media_tools "https://github.com/abcdesktopio/webmodules/blob/4.4/js/screenRecord.js"
```

To get more informations, please, read the public documentation web site:
* [https://www.abcdesktop.io/](https://www.abcdesktop.io/)

## Update and custom front end image

### Requirements 
- `docker` command line to build new image
- `kubectl` to apply new yaml file

### Clone default webmodules  

```bash
git clone -b 4.4 https://github.com/abcdesktopio/webModules.git
```

## Locate project and ui files 

### Update ui.json file

Update your `ui.json` file.  `ui.json` is located in `transpile/config` directory.


```bash
# cd webModules/transpile/config
# ls -la
total 204
drwxrwxr-x   1 root root   4096 Feb  1 15:14 .
drwxr-xr-x   1 root root   4096 Feb  1 15:14 ..
-rw-rw-r--   1 root root     34 Feb  1 15:14 .cache.json
-rw-rw-r--   1 root root   2215 Feb  1 15:11 modules.json
-rw-rw-r--   1 root root   1044 Feb  1 15:11 ui.json
```

`ui.json` is a json dictionary file

The main entry is `name`, name is the project name:


| entry          | default value       | example          |
|----------------|---------------------|------------------|
| name           | abcdesktop.io       | acmedesktop.io   |


```json
{
  "name": "abcdesktop.io",
  "projectNameSplitedHTML": "<span id='projectNameSplitedStagea'>a</span><span id='projectNameSplitedStageb'>b</span><span id='projectNameSplitedStagec'>c</span><span id='p
rojectNameSplitedStaged'>desktop</span>",
  "colors": [
    {
      "name": "@x11bgcolor",
      "value": "#6EC6F0"
    },
    {
      "name": "@primary",
      "value": "#474B55"
    },
    {
      "name": "@secondary",
      "value": "#2D2D2D"
    },
    {
      "name": "@tertiary",
      "value": "#6EC6F0"
    },
    {
      "name": "@quaternary",
      "value": "#1E1E1E"
    },
    {
      "name": "@svgColor",
      "value": "#FFFFFF"
    },
    {
      "name": "@danger",
      "value": "#CD3C14"
    },
    {
      "name": "@success",
      "value": "#32C832"
    },
    {
      "name": "@info",
      "value": "#527EDB"
    },
    {
      "name": "@warning",
      "value": "#FFCC00"
    },
    {
      "name": "@light",
      "value": "#FFFFFF"
    },
    {
      "name": "@dark",
      "value": "#666666"
    },
    {
      "name": "@blue",
      "value": "#4BB4E6"
    },
    {
      "name": "@green",
      "value": "#50BE87"
    },
    {
      "name": "@purple",
      "value": "#A885D8"
    },
    {
      "name": "@pink",
      "value": "#FFB4E6"
    },
    {
      "name": "@yellow",
      "value": "#FFD200"
    }
  ],
  "urlcannotopensession": "/identification/site/",
  "urlusermanual":  "https://www.abcdesktop.io/",
  "urlusersupport": "https://www.abcdesktop.io/",
  "urlopensourceproject": "https://www.abcdesktop.io/"
}
```

##### Login progress

Login progress is from HTML `span` tags

```html
<span id='projectNameSplitedStagea'>a</span>
<span id='projectNameSplitedStageb'>b</span>
<span id='projectNameSplitedStagec'>c</span>
<span id='projectNameSplitedStaged'>desktop</span>
```


#### Colors dictionary entries

| entry          | default value  | example   |
|----------------|----------------|-----------|
| @primary       | #474B55        | #474B55   |
| @secondatry    | #2D2D2D        | #2D2D2D   |
| @tertiary      | #6EC6F0        | #6EC6F0   |

### Create a new `Dockerfile` to build changes

#### Update the ui.json with your own values

Change for example the name to

```
"name": "acmedesktop.io"
```

and the  

```
@tertiary "value": "#00BCD4"
```

Example

```json
{
  "name": "acmedesktop.io",
  "projectNameSplitedHTML": "<span id='projectNameSplitedStagea'>a</span><span id='projectNameSplitedStageb'>c</span><span id='projectNameSplitedStagec'>me</span><span id='p
rojectNameSplitedStaged'>desktop</span>",
  "colors": [
    {
      "name": "@x11bgcolor",
      "value": "#6EC6F0"
    },
    {
      "name": "@primary",
      "value": "#474B55"
    },
    {
      "name": "@secondary",
      "value": "#2D2D2D"
    },
    {
      "name": "@tertiary",
      "value": "#00BCD4"
    },
    {
      "name": "@quaternary",
      "value": "#1E1E1E"
    },
    {
      "name": "@svgColor",
      "value": "#FFFFFF"
    },
    {
      "name": "@danger",
      "value": "#CD3C14"
    },
    {
      "name": "@success",
      "value": "#32C832"
    },
    {
      "name": "@info",
      "value": "#527EDB"
    },
    {
      "name": "@warning",
      "value": "#FFCC00"
    },
    {
      "name": "@light",
      "value": "#FFFFFF"
    },
    {
      "name": "@dark",
      "value": "#666666"
    },
    {
      "name": "@blue",
      "value": "#4BB4E6"
    },
    {
      "name": "@green",
      "value": "#50BE87"
    },
    {
      "name": "@purple",
      "value": "#A885D8"
    },
    {
      "name": "@pink",
      "value": "#FFB4E6"
    },
    {
      "name": "@yellow",
      "value": "#FFD200"
    }
  ],
  "urlcannotopensession": "/identification/site/",
  "urlusermanual":  "https://www.abcdesktop.io/",
  "urlusersupport": "https://www.abcdesktop.io/",
  "urlopensourceproject": "https://www.abcdesktop.io/"
}
```


#### docker build

Run the docker build command to build the new `oc.nginx:acme` image
The target image is `abcdesktopio/oc.nginx:acme` you shoudl change it with your own for example `myacme/oc.nginx:acme`

```bash
docker build --build-arg NODE_MAJOR=20 --build-arg BASE_IMAGE=abcdesktopio/oc.nginx.builder --build-arg BASE_IMAGE_RELEASE=3.3 --build-arg TARGET=dev  -t abcdesktopio/oc.nginx:acme -f Dockerfile .
```

```bash
docker build --build-arg NODE_MAJOR=20 --build-arg BASE_IMAGE=abcdesktopio/oc.nginx.builder --build-arg BASE_IMAGE_RELEASE=3.3 --build-arg TARGET=prod  -t abcdesktopio/oc.nginx:acme -f Dockerfile .
[+] Building 16.5s (19/19) FINISHED                                                                                                                          docker:default
 => [internal] load build definition from Dockerfile                                                                                                                   0.0s
 => => transferring dockerfile: 962B                                                                                                                                   0.0s
 => [internal] load metadata for docker.io/library/nginx:latest                                                                                                        0.0s
 => [internal] load metadata for docker.io/abcdesktopio/oc.nginx.builder:3.3                                                                                           0.0s
 => [internal] load .dockerignore                                                                                                                                      0.0s
 => => transferring context: 2B                                                                                                                                        0.0s
 => CACHED [stage-1 1/2] FROM docker.io/library/nginx:latest                                                                                                           0.0s
 => CACHED [builder  1/11] FROM docker.io/abcdesktopio/oc.nginx.builder:3.3                                                                                            0.0s
 => [internal] load build context                                                                                                                                      0.1s
 => => transferring context: 265.27kB                                                                                                                                  0.1s
 => [builder  2/11] RUN echo current branch is                                                                                                                         0.2s
 => [builder  3/11] RUN echo NODE release is 20                                                                                                                        0.2s
 => [builder  4/11] RUN echo current target is prod it can be 'dev' or 'prod'                                                                                          0.2s
 => [builder  5/11] COPY . /var/webModules                                                                                                                             0.4s
 => [builder  6/11] WORKDIR /var/webModules                                                                                                                            0.1s
 => [builder  7/11] RUN make clean                                                                                                                                     0.7s
 => [builder  8/11] RUN make prod                                                                                                                                      9.7s
 => [builder  9/11] RUN ./mkversion.sh && cat version.json                                                                                                             0.2s
 => [builder 10/11] RUN /myenv/bin/html5validator index.html                                                                                                           2.0s 
 => [builder 11/11] RUN make removebuildtools                                                                                                                          0.8s 
 => [stage-1 2/2] COPY --from=builder /var/webModules /usr/share/nginx/html                                                                                            0.7s 
 => exporting to image                                                                                                                                                 0.7s 
 => => exporting layers                                                                                                                                                0.7s 
 => => writing image sha256:d7bdbc9f7fafe3282161551e84c5997bb12051bded6405190267863dd73a1698                                                                           0.0s
 => => naming to docker.io/abcdesktopio/oc.nginx:acme  
```

#### update the `abcdesktop.yaml`

- update the `abcdesktop.yaml` to replace `abcdesktopio/oc.nginx:3.3` by your own image `myacme/oc.nginx:acme`
- apply the new `abcdesktop.yaml`

```
kubectl apply -f abcdesktop.yaml
```

