let currentsong = new Audio();
let songs;
let currFolder;
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getsongs(folder) {
  currFolder = folder;
  let a = await fetch(`http://127.0.0.1:3002/${folder}/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");
  songs = [];

  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      let parts = element.href.split("%5C");
      let trackName = parts[parts.length - 1];
      songs.push(trackName);
    }
  }

  // Show all the songs in the playlist
  let songul = document
    .querySelector(".songlist")
    .getElementsByTagName("ul")[0];
  songul.innerHTML = "";
  for (const song of songs) {
    songul.innerHTML =
      songul.innerHTML +
      `<li>
                          <img class="invert" src="images/music.svg" alt="">
                          <div class="info">
                              <div>${song.replaceAll("%20", " ")}</div>
                              <div>Tarik Jamil</div>
                          </div>
                          <div class="playnow">
                              <span>Play Now</span>
                              <img class="invert" src="images/play2.svg" alt="">
                          </div>
                      </li>
     </li>`;
  }

  // Attach an event listener to each song
  Array.from(
    document.querySelector(".songlist").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", (element) => {
      playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
    });
  });
  return songs;
}

const playMusic = (track, pause = false) => {
  currentsong.src = `/${currFolder}/` + track;
  if (!pause) {
    currentsong.play();
    play.src = "images/pause.svg";
  }
  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00/00";
};

async function displayAlbums() {
  let a = await fetch(`http://127.0.0.1:3002/songs/`);
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");

  let cardContainer = document.querySelector(".cardContainer");

  // Loop through folder links
  let array = Array.from(anchors);
  for (let index = 0; index < array.length; index++) {
    const e = array[index];

    if (e.href.includes("%5Csongs%5C")) {
      let parts = e.href.split("%5C");
      let folder = parts[parts.length - 1].replace("/", "");

      //  Fetch folder page to check for info.json
      let folderPage = await fetch(`http://127.0.0.1:3002/songs/${folder}/`);
      let folderHTML = await folderPage.text();
      let tempDiv = document.createElement("div");
      tempDiv.innerHTML = folderHTML;

      // Check for info.json
      let files = Array.from(tempDiv.getElementsByTagName("a"));
      let hasInfo = files.some((a) => a.href.endsWith("info.json"));
      if (!hasInfo) continue; //

      //  Fetch info.json
      let infoFetch = await fetch(
        `http://127.0.0.1:3002/songs/${folder}/info.json`
      );
      let info = await infoFetch.json();

      //  Add album card
      cardContainer.innerHTML += `
        <div data-folder="${folder}" class="card">
          <div class="play">
            <img src="images/play.svg" alt="">
          </div>
          <img src="/songs/${folder}/cover.jpg" alt="">
          <h2>${info.title}</h2>
          <p>${info.description}</p>
        </div>`;
    }
  }

  // Load the playlist whenever card is clicked
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
      playMusic(songs[0]);
    });
  });
}

async function main() {
  // Get the list of all the songs
  await getsongs("songs/Bangla");
  playMusic(songs[0], true);

  // Display all the albums on the page
  displayAlbums();

  // Attach an event listener to play, next and previous
  play.addEventListener("click", () => {
    if (currentsong.paused) {
      currentsong.play();
      play.src = "images/pause.svg";
    } else {
      currentsong.pause();
      play.src = "images/play2.svg";
    }
  });

  // Listen for timeupdate event
  currentsong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(
      currentsong.currentTime
    )} / ${secondsToMinutesSeconds(currentsong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentsong.currentTime / currentsong.duration) * 100 + "%";
  });

  // Add an event listener to seekbar
  document.querySelector(".seekber").addEventListener("click", (e) => {
    let parcent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = parcent + "%";
    currentsong.currentTime = (currentsong.duration * parcent) / 100;
  });

  // Add an event listener for hamburger
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".leftbox").style.left = "0";
  });

  // Add an event listener for close button
  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".leftbox").style.left = "-120%";
  });

  // Add an event listener to previous
  prevsong.addEventListener("click", () => {
    console.log("previous song");
    let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  // Add an event listener to next
  next.addEventListener("click", () => {
    console.log("next song");
    let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // Add an event to volume
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("input", (e) => {
      console.log("volume range: ", e.target.value + " /100");
      currentsong.volume = parseInt(e.target.value) / 100;
    });

  let lastVolume = 0.1; // start with a small default

  const volumeIcon = document.querySelector(".volume>img");
  const rangeInput = document.querySelector(".range input");

  // update lastVolume when user moves the slider
  rangeInput.addEventListener("input", (e) => {
    currentsong.volume = e.target.value / 100;
    lastVolume = currentsong.volume; // keep remembering latest volume
  });

  // toggle mute/unmute
  volumeIcon.addEventListener("click", (e) => {
    if (currentsong.volume > 0) {
      // user is muting
      lastVolume = currentsong.volume; // remember this
      currentsong.volume = 0;
      rangeInput.value = 0;
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
    } else {
      // user is unmuting
      currentsong.volume = lastVolume; // restore last known
      rangeInput.value = lastVolume * 100;
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
    }
  });
}

main();
