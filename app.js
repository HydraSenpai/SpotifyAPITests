var redirect_uri = "";

var clientId = "";
var clientSecret = "";

const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = 'https://accounts.spotify.com/api/token';
const DEVICES = 'https://api.spotify.com/v1/me/player/devices';
const PLAYLISTS = 'https://api.spotify.com/v1/me/playlists';
const PLAY = 'https://api.spotify.com/v1/me/player/play';
const PREV = 'https://api.spotify.com/v1/me/player/previous';
const PAUSE = 'https://api.spotify.com/v1/me/player/pause';
const NEXT = 'https://api.spotify.com/v1/me/player/next';

function onPageLoad(){
    clientId = localStorage.getItem("clientId");
    clientSecret = localStorage.getItem("clientSecret");

    if(window.location.search.length > 0){
        handleRedirect();
    }
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken(code);
    window.history.pushState("","", redirect_uri);
}

function getCode(){
    let code = null;
    const query = window.location.search;
    if(query.length>0){
        const urlParams = new URLSearchParams(query);
        code = urlParams.get('code');
    }
    return code;
}

function fetchAccessToken(code){
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + clientId;
    body += "&client_secret=" + clientSecret;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(clientId + ':' + clientSecret));
    xhr.send(body);
    xhr.onload = requestAuthorizationResponse;
}

function requestAuthorizationResponse(){
    if(this.status === 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if(data.access_token != undefined){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if(data.refresh_token != undefined){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    } else {
        alert(this.responseText);
    }
}


function requestAuthorization(){
    clientId = document.getElementById("clientId").value;
    clientSecret = document.getElementById("clientSecret").value;

    localStorage.setItem("clientId", clientId);
    localStorage.setItem("clientSecret", clientSecret);

    let url = AUTHORIZE;
    url += "?client_id=" + clientId;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played user-top-read user-read-currently-playing user-read-private";

    window.location.href = url;

}

function refreshDevices(){
    callApi("GET", DEVICES, null, handleDevicesResponse);
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function handleDevicesResponse(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems("devices");
        data.devices.forEach(item => addDevice(item));
    } else if(this.status == 401){
        refreshAccessToken();
    } else{
        console.log(this.responseText);
        alert(this.responseText);
    }
}



function removeAllItems(elementId){
    let node = document.getElementById(elementId);
    while(node.firstChild){
        node.removeChild(node.firstChild);
    }
}

function addDevice(item){
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById('devices').appendChild(node);
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + clientId;
    callAuthorizationApi(body);
}

function getPlaylists(){
    callApi("GET", PLAYLISTS, null, handlePlaylistResponce);
}


function handlePlaylistResponce(){
    if(this.status == 200){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems("playlists");
        data.items.forEach(item => addPlaylist(item));
    } else if(this.status == 401){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addPlaylist(item){
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById('playlists').appendChild(node);
}

function playSong(){
    callApi("PUT", PLAY, null, handlePlay);
}

function handlePlay(){
    if(this.status == 204){
        console.log("working!");
    } else if(this.status == 401){
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function goBack(){
    callApi("POST", PREV, null, handlePlay);
}

function pauseSong(){
    callApi("PUT", PAUSE, null, handlePlay);
}

function goForward(){
    callApi("POST", NEXT, null, handlePlay);
}