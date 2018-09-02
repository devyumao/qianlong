import { Live2DFramework } from "./lib/Live2DFramework";
import { PlatformManager } from "./PlatformManager";
import { cModel } from "./cModel";
import { cDefine } from "./cDefine";

function cManager() {
  // console.log("--> cManager()");

  this.models = [];
  this.count = -1;
  this.reloadFlg = false;

  Live2DFramework.setPlatformManager(new PlatformManager());

}

cManager.prototype.createModel = function () {

  var model = new cModel();
  this.models.push(model);

  return model;

}


cManager.prototype.changeModel = function (gl, modelurl) {
  // console.log("--> cManager.update(gl)");

  if (this.reloadFlg) {
    this.reloadFlg = false;
    this.releaseModel(0, gl);
    this.createModel();
    this.models[0].load(gl, modelurl);
  }

};


cManager.prototype.getModel = function (no) {
  // console.log("--> cManager.getModel(" + no + ")");

  if (no >= this.models.length) return null;

  return this.models[no];
};



cManager.prototype.releaseModel = function (no, gl) {
  // console.log("--> cManager.releaseModel(" + no + ")");

  if (this.models.length <= no) return;

  this.models[no].release(gl);

  delete this.models[no];
  this.models.splice(no, 1);
};



cManager.prototype.numModels = function () {
  return this.models.length;
};



cManager.prototype.setDrag = function (x, y) {
  for (var i = 0; i < this.models.length; i++) {
    this.models[i].setDrag(x, y);
  }
}

// cManager.prototype.setAccel = function (x, y, z) {
//   for (var i = 0; i < this.models.length; i++) {
//     this.models[i].setAccel(x, y, z)
//   }
// }

cManager.prototype.setRotationRate = function (rate) {
  for (var i = 0; i < this.models.length; i++) {
    this.models[i].setRotationRate(rate)
  }
}

cManager.prototype.setOrient = function (alpha, beta, gamma) {
  for (var i = 0; i < this.models.length; i++) {
    this.models[i].setOrient(alpha, beta, gamma)
  }
}

cManager.prototype.tapEvent = function (x, y) {
  if (cDefine.DEBUG_LOG)
    console.log("tapEvent view x:" + x + " y:" + y);

  for (var i = 0; i < this.models.length; i++) {

    if (this.models[i].hitTest(cDefine.HIT_AREA_HEAD, x, y)) {

      if (cDefine.DEBUG_LOG)
        console.log("Tap face.");

        // for demo video
        // if (this.haha) {
        //   this.models[i].startMotion(cDefine.MOTION_GROUP_TAP_BODY, 1, cDefine.PRIORITY_NORMAL)
        // }
        // else {
        //   this.models[i].startMotion(cDefine.MOTION_GROUP_TAP_BODY, 7, cDefine.PRIORITY_NORMAL)
        // }

      // TODO: fake random
      Math.random() < 0.5
        ? this.models[i].setRandomExpression()
        : this.models[i].startRandomMotion(cDefine.MOTION_GROUP_TAP_BODY,
          cDefine.PRIORITY_NORMAL);
      // this.models[i].startRandomMotion(cDefine.MOTION_GROUP_TAP_BODY, cDefine.PRIORITY_NORMAL);
    }
    // else if (this.models[i].hitTest(cDefine.HIT_AREA_BODY, x, y)) {

    //   if (cDefine.DEBUG_LOG)
    //     console.log("Tap body." + " models[" + i + "]");

    //   this.models[i].startRandomMotion(cDefine.MOTION_GROUP_TAP_BODY,
    //     cDefine.PRIORITY_NORMAL);
    // }
  }

  return true;
};

export{
  cManager,
}
