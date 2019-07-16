// to show year
$('#year').text(new Date().getFullYear());
// Header animation
/*------------------------------
Map
------------------------------*/
const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;


/*------------------------------
                                                                                  Mouse
                                                                                  ------------------------------*/
const mouse = {
  x: 0,
  y: 0
};

const mouseMove = e => {
  mouse.x = e.clientX || e.touches[0].clientX;
  mouse.y = e.clientY || e.touches[0].clientY;
};
window.addEventListener('mousemove', mouseMove);
window.addEventListener('touchstart', mouseMove);
window.addEventListener('touchmove', mouseMove);


/*------------------------------
                                                 GLSL TEMPLATE
                                                 ------------------------------*/
class GLSLTemplate {
  constructor(opt) {
    Object.assign(this, opt);

    this.loadImages();
  }


  /*------------------------------
    Load Image
    ------------------------------*/
  loadImages() {
    this.textures = [];
    let loadedImages = 0;

    // loop images
    for (let i = 0; i < this.images.length; i++) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.crossOrigin = '';
      textureLoader.load(this.images[i], img => {
        img.magFilter = THREE.NearestFilter;
        this.textures.push({
          texture: img
        });
        this.checkLoadedImages();
      });
    }
  }

  /*------------------------------
    Check Load Images
    ------------------------------*/
  checkLoadedImages() {
    if (this.textures.length === this.images.length) {
      this.setTexturesRatio();
      this.setup();
    }
  }


  /*------------------------------
    Set Textures Ratio
    ------------------------------*/
  setTexturesRatio() {
    this.winRatio = window.innerWidth / window.innerHeight;
    console.log(this.winRatio);
    for (let i = 0; i < this.textures.length; i++) {
      const t = this.textures[i];
      const textureRatio = t.texture.image.naturalWidth / t.texture.image.naturalHeight;
      t.ratio = this.winRatio > textureRatio ? new THREE.Vector2(1.0, textureRatio / this.winRatio) : new THREE.Vector2(this.winRatio / textureRatio, 1.0);
    }
  }


  /*------------------------------
    Setup
    ------------------------------*/
  setup() {
    this.uniforms = {
      time: {
        type: "f",
        value: 1.0
      },
      resolution: {
        type: "v2",
        value: new THREE.Vector2()
      },
      u_mouse: {
        type: "v2",
        value: new THREE.Vector2(0, 0)
      },
      texture_0: {
        type: "t",
        value: this.textures[0].texture
      },
      ratio_0: {
        type: "v2",
        value: this.textures[0].ratio
      },
      texture_1: {
        type: "t",
        value: this.textures[1].texture
      },
      ratio_1: {
        type: "v2",
        value: this.textures[1].ratio
      }
    };

    this.vertexShader = `
			void main() {
				gl_Position = vec4(position, 1.0);
			  }
		`;
    this.fragmentShader = `
			uniform vec2 resolution;
			uniform float time;
      uniform vec2 u_mouse;
      uniform sampler2D texture_0;
      uniform sampler2D texture_1;
      uniform vec2 ratio_0;
      uniform vec2 ratio_1;

			void main(){
        
				vec2 uv = gl_FragCoord.xy / resolution.xy;

        // IMAGE 0
        vec2 ratio_image_0 = uv * ratio_0;
        if (ratio_0.x < 1.) {
          ratio_image_0.x += ((1. - ratio_0.x) / 2.);
        }
        if (ratio_0.y < 1.) {
          ratio_image_0.y += ((1. - ratio_0.y) / 2.);
        }
        vec4 image_0 = texture2D(texture_0, ratio_image_0);

        
        // IMAGE 1
        vec2 ratio_image_1 = uv * ratio_1;
        if (ratio_1.x < 1.) {
          ratio_image_1.x += ((1. - ratio_1.x) / 2.);
        }
        if (ratio_1.y < 1.) {
          ratio_image_1.y += ((1. - ratio_1.y) / 2.);
        }
        vec4 image_1 = texture2D(texture_1, ratio_image_1);


        // SLIDE PROGRESS
        float slideProgress = u_mouse.y;
        float colorProgress = uv.y + slideProgress;
        colorProgress = slideProgress * 4.8 - uv.y * 3. + uv.x * 0.8 - 0.8;
        colorProgress = clamp(colorProgress, 0., 1.);

        
				// gl_FragColor = vec4(vec3(colorProgress), 0.0);
        // gl_FragColor = image_1;
        gl_FragColor = mix(image_0,image_1,colorProgress);
			}
		`;

    this.startTime = Date.now();
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();

    this.init();
  }


  /*------------------------------
    Init
    ------------------------------*/
  init() {
    this.camera.position.z = 1;
    this.geometry = new THREE.PlaneBufferGeometry(16, 9);
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader
    });


    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
    this.renderer = new THREE.WebGLRenderer();
    this.container.appendChild(this.renderer.domElement);

    this.resize();
    this.render();
    this.events();
  }


  /*------------------------------
    Events
    ------------------------------*/
  events() {
    window.addEventListener('resize', this.resize.bind(this), false);
  }


  /*------------------------------
    Resize
    ------------------------------*/
  resize() {
    this.setTexturesRatio();
    this.uniforms.resolution.value.x = window.innerWidth;
    this.uniforms.resolution.value.y = window.innerHeight;
    this.uniforms.ratio_0.value = this.textures[0].ratio;
    this.uniforms.ratio_1.value = this.textures[1].ratio;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }


  /*------------------------------
    Render
    ------------------------------*/
  render() {
    this.currentTime = Date.now();
    this.elaspedSeconds = (this.currentTime - this.startTime) / 1000.0;
    this.uniforms.time.value = this.elaspedSeconds;
    this.uniforms.u_mouse.value.x = map(mouse.x, 0, window.innerWidth, 0, 1);
    this.uniforms.u_mouse.value.y = map(mouse.y, 0, window.innerHeight, 1, 0);

    this.renderer.render(this.scene, this.camera);
    this.RaF = requestAnimationFrame(this.render.bind(this));
  }
}



/*------------------------------
     Initialize
     ------------------------------*/
const shader = new GLSLTemplate({
  container: document.getElementById('container'),
  images: [
    'img/How-to-Buy-Clothes-Wholesale-in-Kenya.jpg',
    'img/adult-agriculture-blue-sky-2582569-min.jpg'
  ]
});


// Navbar
const togglebtns = document.querySelectorAll('.nav-toggle');
const sideBar = document.querySelector('div.side-navbar');
const sidebarLinks = document.querySelectorAll('.side-navbar li');
// const threeDotMenu = document.querySelector('div.nav-menu-icon');
// const navMenu = document.querySelector('div.nav-menu');
const backgroundFader = document.getElementsByClassName('background-fader')[0];

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('fa-times')) {
    toggleSidebar();
    console.log('came inside times');
    // break;
  }
  if (sideBar.classList.contains('show-side-navbar')) {
    // sideBar.classList.toggle('show-side-navbar');
    // backgroundFader.classList.toggle('fade-background');
    // console.log(e.target.classList.contains('fa-bars'));
    toggleSidebar();
    // break;
    console.log('came inside total');
  }
  if (e.target.classList.contains('fa-bars')) {
    toggleSidebar();
    console.log('came inside bars');
    // break;
  }

  // console.log(sideBar.classList.contains('show-side-navbar'));
});

function toggleSidebar() {
  sideBar.classList.toggle('show-side-navbar');
  backgroundFader.classList.toggle('fade-background');
}

// togglebtns.forEach(togglebtn => {
//   togglebtn.onclick = function () {
//     toggleSidebar();
//   };
// });

backgroundFader.onclick = () => {
  toggleSidebar(); // this is much easier to understand
};

// Handle clicks on li element inside navigation sidebar 
sidebarLinks.forEach(link => {
  link.onclick = e => {
    // e.preventDefault();
    toggleSidebar();
  };
});

// Animation carousel
function animationCarousel(radiusParam) {
  // Các bạn có thể thay đổi giá trị các biến môi trường ở đây:
  var radius = radiusParam; // Độ rộng vòng xoay
  function myFunction(x) {
    if (x.matches) { // If media query matches
      // document.body.style.backgroundColor = "yellow";
      radius = 120;
    } else {
      //  document.body.style.backgroundColor = "pink";
      radius = 240;
    }
  }

  var x = window.matchMedia("(max-width: 800px)")
  myFunction(x) // Call listener function at run time
  x.addListener(myFunction)

  var autoRotate = true; // Tự động xoay hay không
  var rotateSpeed = -60; // đơn vị: giây/vòng. thời gian để xoay hết 1 vòng, dấu trừ để xoay ngược lại
  var imgWidth = 120; // độ rộng ảnh (tính theo px)
  var imgHeight = 170; // độ cao ảnh (tính theo px)

  // Link nhạc nền - cho bằng null nếu không muốn nhạc nền
  var bgMusicURL = 'https://api.soundcloud.com/tracks/143041228/stream?client_id=587aa2d384f7333a886010d5f52f302a';
  var bgMusicControls = true; // Hiện khung điều khiển nhạc nền hay không

  /*
          CHÚ Ý:
              + imgWidth, imgHeight sẽ dùng được cho cả video -> <video> cũng sẽ được thu nhỏ cho bằng <img>
              + nếu imgWidth, imgHeight đủ nhỏ, có thể <video> sẽ không hiện nút play/pause
              + Link nhạc lấy từ: https://hoangtran0410.github.io/Visualyze-design-your-own-/?theme=HoangTran&playlist=2&song=8&background=3
              + https://api.soundcloud.com/tracks/191576787/stream?client_id=587aa2d384f7333a886010d5f52f302a
              + Phiên bản 1 file .html duy nhất: https://github.com/HoangTran0410/3DCarousel/blob/master/index.html

          Author: Hoang Tran, custom from code in tiktok video 
                  https://www.facebook.com/J2TEAM.ManhTuan/videos/1353367338135935/
      */


  // ===================== start =======================
  setTimeout(init, 100);

  var obox = document.getElementById('drag-container');
  var ospin = document.getElementById('spin-container');
  var aImg = ospin.getElementsByTagName('img');
  var aVid = ospin.getElementsByTagName('video');
  var aEle = [...aImg, ...aVid]; // gộp 2 mảng lại

  // chỉnh độ lớn ảnh
  ospin.style.width = imgWidth + "px";
  ospin.style.height = imgHeight + "px";

  // chỉnh độ lớn ground - theo radius
  var ground = document.getElementById('ground');
  ground.style.width = radius * 3 + "px";
  ground.style.height = radius * 3 + "px";

  function init(delayTime) {
    for (var i = 0; i < aEle.length; i++) {
      aEle[i].style.transform = "rotateY(" + (i * (360 / aEle.length)) + "deg) translateZ(" + radius + "px)";
      aEle[i].style.transition = "transform 1s";
      aEle[i].style.transitionDelay = delayTime || (aEle.length - i) / 4 + "s";
    }
  }

  function applyTranform(obj) {
    // Không cho góc xoay phương Y ra ngoài khoảng 0-180
    if (tY > 180) tY = 180;
    if (tY < 0) tY = 0;

    // Áp dụng góc xoay
    obj.style.transform = "rotateX(" + (-tY) + "deg) rotateY(" + (tX) + "deg)";
  }

  function playSpin(yes) {
    ospin.style.animationPlayState = (yes ? 'running' : 'paused');
  }

  var sX, sY, nX, nY, desX = 0,
    desY = 0,
    tX = 0,
    tY = 10;

  // tự động xoay
  if (autoRotate) {
    var animationName = (rotateSpeed > 0 ? 'spin' : 'spinRevert');
    ospin.style.animation = `${animationName} ${Math.abs(rotateSpeed)}s infinite linear`;
  }

  // thêm nhạc nền
  if (bgMusicURL) {
    document.getElementById('music-container').style.display = 'none';
    document.getElementById('music-container').innerHTML = `
<audio src="${bgMusicURL}" ${bgMusicControls? 'controls': ''} autoplay loop>    
<p>If you are reading this, it is because your browser does not support the audio element.</p>
</audio>
`;
  }

  // cài đặt events
  if (mobilecheck()) {
    // ==================== Touch Events ====================
    // document.ontouchstart = function (e) {
    //   clearInterval(obox.timer);
    //   e = e || window.event;
    //   var sX = e.touches[0].clientX,
    //     sY = e.touches[0].clientY;

    //   this.ontouchmove = function (e) {
    //     e = e || window.event;
    //     var nX = e.touches[0].clientX,
    //       nY = e.touches[0].clientY;
    //     desX = nX - sX;
    //     desY = nY - sY;
    //     tX += desX * 0.1;
    //     tY += desY * 0.1;
    //     applyTranform(obox);
    //     sX = nX;
    //     sY = nY;
    //   }

    //   this.ontouchend = function (e) {
    //     this.ontouchmove = this.ontouchend = null;
    //     obox.timer = setInterval(function () {
    //       desX *= 0.95;
    //       desY *= 0.95;
    //       tX += desX * 0.1;
    //       tY += desY * 0.1;
    //       applyTranform(obox);
    //       playSpin(false);
    //       if (Math.abs(desX) < 0.5 && Math.abs(desY) < 0.5) {
    //         clearInterval(obox.timer);
    //         playSpin(true);
    //       }
    //     }, 17);
    //   }

    //   // return false;
    // }
    document.ontouchstart = function (e) {
      clearInterval(obox.timer);
      e = e || window.event;
      var sX = e.touches[0].clientX;
      // sY = e.touches[0].clientY;

      this.ontouchmove = function (e) {
        e = e || window.event;
        var nX = e.touches[0].clientX;
        // nY = e.touches[0].clientY;
        desX = nX - sX;
        // desY = nY - sY;
        tX += desX * 0.1;
        // tY += desY * 0.1;
        applyTranform(obox);
        sX = nX;
        // sY = nY;
      }

      this.ontouchend = function (e) {
        this.ontouchmove = this.ontouchend = null;
        obox.timer = setInterval(function () {
          desX *= 0.95;
          // desY *= 0.95;
          tX += desX * 0.1;
          // tY += desY * 0.1;
          applyTranform(obox);
          playSpin(false);
          if (Math.abs(desX) < 0.5) {
            clearInterval(obox.timer);
            playSpin(true);
          }
        }, 17);
      }

      // return false;
    }
  } else {
    // ==================== Mouse Events ====================
    document.onmousedown = function (e) {
      clearInterval(obox.timer);
      e = e || window.event;
      var sX = e.clientX,
        sY = e.clientY;

      this.onmousemove = function (e) {
        e = e || window.event;
        var nX = e.clientX,
          nY = e.clientY;
        desX = nX - sX;
        desY = nY - sY;
        tX += desX * 0.1;
        tY += desY * 0.1;
        applyTranform(obox);
        sX = nX;
        sY = nY;
      }

      this.onmouseup = function (e) {
        this.onmousemove = this.onmouseup = null;
        obox.timer = setInterval(function () {
          desX *= 0.95;
          desY *= 0.95;
          tX += desX * 0.1;
          tY += desY * 0.1;
          applyTranform(obox);
          playSpin(false);
          if (Math.abs(desX) < 0.5 && Math.abs(desY) < 0.5) {
            clearInterval(obox.timer);
            playSpin(true);
          }
        }, 13);
      }

      return false;
    }
    // document.onmousewheel = function (e) {
    //   e = e || window.event;
    //   var d = e.wheelDelta / 20 || -e.detail;
    //   radius += d;
    //   init(1);
    // };
  }

  // https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
  function mobilecheck() {
    var check = false;
    (function (a) {
      if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
  }

}

animationCarousel(240);

$(document).on('click', '[data-toggle="lightbox"]', function (event) {
  event.preventDefault();
  $(this).ekkoLightbox();
});
// image array
const mensImages = [
  'men-back.jpg',
  'men-cap.jpg',
  'men-shadow.jpg',
  'men-hoodi-1.jpg',
  'men-hoodi-2.jpg',
  'men-hoodi-3.jpg',
];
const womensImages = [
  'women-back.jpg',
  'women-hair.jpg',
  'women-hoody.jpg',
  'women-swat.jpg',
];
const babiesImages = [];
const organicImages = [];
const agroImages = [];
// buttons
let spin_cont = document.querySelector('#spin-container');
// console.log('#spin_container');
// alert(1);
// const womensImgArr = [];
const womensBtn = document.querySelector('.womens');
const mensBtn = document.querySelector('.mens');

womensBtn.addEventListener('click', () => {
  changeImage(womensImages);
});
mensBtn.addEventListener('click', () => {
  changeImage(mensImages);
});

changeImage(mensImages);

function changeImage(imageArr) {
  let html = '';
  imageArr.forEach((single) => {
    let newHtml = `<a target="_blank"
    href="img/${single}"
    data-toggle="lightbox"
    data-gallery="example-gallery"
    class="d_image">
    <img src="img/${single}"
      alt="">
  </a>`;
    html += newHtml;
  });
  spin_cont.innerHTML = html;
  document.querySelector('#music-container').removeChild(document.querySelector('#music-container audio'))
  animationCarousel(240);
}

// form

var $input;

function onInputFocus(event) {
  var $target = $(event.target);
  var $parent = $target.parent();
  $parent.addClass('input--filled');
};

function onInputBlur(event) {
  var $target = $(event.target);
  var $parent = $target.parent();

  if (event.target.value.trim() === '') {
    $parent.removeClass('input--filled');
  }
};

$(document).ready(function () {
  $input = $('.input__field');

  // in case there is any value already
  $input.each(function () {
    if ($input.val().trim() !== '') {
      var $parent = $input.parent();
      $parent.addClass('input--filled');
    }
  });

  $input.on('focus', onInputFocus);
  $input.on('blur', onInputBlur);
});

// carousel size
function myFunction(x) {
  if (x.matches) { // If media query matches
    // document.body.style.backgroundColor = "yellow";
    animationCarousel(120);
  } else {
    //  document.body.style.backgroundColor = "pink";
    animationCarousel(240);
  }
}

var x = window.matchMedia("(max-width: 800px)")
myFunction(x) // Call listener function at run time
x.addListener(myFunction);