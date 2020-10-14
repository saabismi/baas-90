const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
const fs = require("fs");
window.playing = "Currently not playing anything";

let audio = new Audio();

//function to convert seconds to seconds and minutes.
function formatSecondsAsTime(secs, format) {
  var hr  = Math.floor(secs / 3600);
  var min = Math.floor((secs - (hr * 3600))/60);
  var sec = Math.floor(secs - (hr * 3600) -  (min * 60));

  if (min < 10){
    min = "0" + min;
  }
  if (sec < 10){
    sec  = "0" + sec;
  }

  return min + ':' + sec;
}

//Updetes the time every second
audio.ontimeupdate = () => {
	var currTimeDiv = document.getElementById('songprogress');
	var durationDiv = document.getElementById('songlength');

	var currTime = Math.floor(audio.currentTime).toString();
	var duration = Math.floor(audio.duration).toString();

	currTimeDiv.innerHTML = formatSecondsAsTime(currTime);

	if (isNaN(duration)){
		durationDiv.innerHTML = '--:--';
		currTimeDiv.innerHTML = '--:--';
	}
	else{
		durationDiv.innerHTML = formatSecondsAsTime(duration);
	}
}

//play next song when audio has ended.
audio.onended = () => {
	playTrack('playing', lists.playing.now+1);
}

//Declare needed playlists
let lists = {
	search: {
		name: "search",
		target: "results",
		items: [],
		now: 0,
		playing: false,
	},
	playing: {
		name: "playing",
		target: "currentList",
		items: [],
		now: 0,
		playing: false,
	},
};

//FUnction to remove track from a playlist, list is the plylist's name (string) and track is the index of the track.
function removeTrack(list, track) {
	lists[list].items.splice(track, 1);
	printList(list, lists[list].target, 'display');
	playTrack(list);
}

//Function to move the player time by -10sec
function prevSong() {
	audio.currentTime-=10;
}

//Function to move the player time by +10sec
function nextSong() {
	audio.currentTime+=10;
}

//Function to play specified track in playlist
function playTrack(list, track) {
	if (!(track === undefined) || !lists[list].playing) {
		//If the track is specified, set the player to play that track.
		if (!(track === undefined)) {lists[list].now=track;}

		if (lists[list].now < 0 || lists[list].now >= lists[list].items.lenght) {
			//If track is nonexistent, reset player.
			lists[list].now = 0;
			lists[list].playing = false;
			document.getElementById('playing').innerText = " "
			window.playing = "Currently not playing anything";
			return;
		}
		//Update Discord RPC and the marquee
		document.getElementById('playing').innerText = lists[list].items[lists[list].now].title
		window.playing = lists[list].items[lists[list].now].title;

		audio.src = `../${lists[list].items[lists[list].now].source}`;
		audio.time = 0;
		audio.play();
		lists[list].playing = true;
	}
}

//(WIP) function to save list
function saveList(name) {
	lists[name]=lists.playing;
	lists[name].name=name;
	printLists("playlists");
}

//Function to play a specified playlist (moves it to currently playing -playlist.)
function playList(list) {
	lists.playing.items = [];
	lists.playing.items = lists[list].items;
}

//Function to print all playlists in memory. Target is the id of HTML element where to print. (WIP)
function printLists(target) {
	div = document.getElementById(target);
	for (let key in lists) {
	    if (p.hasOwnProperty(key)) {
			button = document.createElement("BUTTON");
			button.setAttribute("class","playlist");
			button.setAttribute("onClick", `playList(${key});`);
	        div.appendChild(button);
			button.innerText = lists[key].name;
	    }
	}
}

//Loads youtube video. From is the playlist where the video is, id is the index of track, to is where to append track when loaded.
function loadVideo(from, id, to) {
	let item = lists[from].items[id];
	//Avoid filesystem messing with onverting " " to "_"
	let destination = `tracks/${item.title.replace(/\ /g,'_')}.mp4`;
	//Make track data
	let track = {
		title: item.title,
		url: item.link,
		thumbnail: item.thumbnail,
		duration: item.duration,
		source: destination,
		playing: false,
	};
	//Push track data to list
	lists[to].items.push(track);
	//Do not download the track if it is already in memory.
	if (!fs.existsSync(destination)) {
		let stream = fs.createWriteStream(destination);
		//fetch from YT
		ytdl(item.url,{ filter: format => format.container === 'mp4' }).pipe(stream);
		stream.on("close", ()=>{
			//play the track when downloaded
			playTrack('playing');
		})
	} else {
		//play the track.
		playTrack('playing');
	}
	//Update playlist.
	printList('playing', 'currentList','display');
}

//Function to get search results and save them to "search" playlist.
function search(string) {
	//reset search playlist:
	lists.search.items = [];
	ytsr(string, {limit: 3}).then(result => {
		result.items.forEach((item, i) => {
			//create new track data from search result
			let track = {
				title: item.title,
				url: item.link,
				thumbnail: item.thumbnail,
				duration: item.duration,
				playing: false,
			};
			//append data to playlist "search"
			lists.search.items.push(track);
		});
		//update search list
		printList('search','results','play');
	});
}

//Function to print list items, list is the list to print (string), target is HTML element id where to print and action is the way of displaying.
function printList(list,target,action) {
	let div = document.getElementById(target);
	div.innerHTML = "";
	lists[list].items.forEach((item, i) => {
		let button = document.createElement("BUTTON");
		switch (action) {
			case 'play':
				//Bind a function to the button
				button.setAttribute("onClick",`loadVideo('search', ${i}, 'playing' ); `);
				//And a class
				button.setAttribute("class", "searchResult");
				div.appendChild(button);
				//Set button text (image in this cae)
				button.innerHTML = (`<img class="thumbnail" src='${item.thumbnail}'><br>${item.title}`);
				break;
			case 'display':
				//button is actually div element
				button = document.createElement("DIV");
				//class
				button.setAttribute("class", "playingTrack");
				div.appendChild(button);
				//Add two buttons to div, one to play that track, one to delete it.
				button.innerHTML = (`<button class='playingTrack_button' onClick="playTrack('playing',${i});">${item.title}</button><br><button onClick="removeTrack('playing', ${i});">Delete</button>`);
				break;
			}
	});
}

//hillon juttui

function playAndPause() {

	if (audio.paused) {
		audio.play();
		console.log("Playback continued");
	} else {
		audio.pause()
		console.log("Playback paused");
	}
}
