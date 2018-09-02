import { Live2DFramework, L2DBaseModel, L2DEyeBlink, L2DExpressionMotion } from "./lib/Live2DFramework";
import { ModelSettingJson } from "./utils/ModelSettingJson";
import { MatrixStack } from "./utils/MatrixStack";
import { cDefine } from "./cDefine";
import { UtSystem,/*
         UtDebug,
         LDTransform,
         LDGL,
         Live2D,
         Live2DModelWebGL,
         Live2DModelJS,
         Live2DMotion,
         MotionQueueManager,
         PhysicsHair,
         AMotion,
         PartsDataID,
         DrawDataID,
         BaseDataID,
         ParamID*/ } from './lib/live2d.core';
import { clamp } from 'lodash'

//============================================================
//============================================================
//  class cModel     extends L2DBaseModel
//============================================================
//============================================================
export function cModel()
{
    //L2DBaseModel.apply(this, arguments);
    L2DBaseModel.prototype.constructor.call(this);

    this.modelHomeDir = "";
    this.modelSetting = null;
    this.tmpMatrix = [];
    this.initialOrient = null
    this.lastOrient = null
    this.orient = null
    this.orientOffset = { alpha: 0, beta: 0, gamma: 0 }
}

cModel.prototype = new L2DBaseModel();

cModel.prototype.ROTATION_SEGMENTATION = 30


cModel.prototype.load = function(gl, modelSettingPath, callback)
{
    this.setUpdating(true);
    this.setInitialized(false);

    this.modelHomeDir = modelSettingPath.substring(0, modelSettingPath.lastIndexOf("/") + 1);

    this.modelSetting = new ModelSettingJson();

    var thisRef = this;

    this.modelSetting.loadModelSetting(modelSettingPath, function(){

        var path = thisRef.modelHomeDir + thisRef.modelSetting.getModelFile();
        thisRef.loadModelData(path, function(model){

            for (var i = 0; i < thisRef.modelSetting.getTextureNum(); i++)
            {
                if( /^https?:\/\/|^\/\//i.test(thisRef.modelSetting.getTextureFile(i)) ){

                    var texPaths = thisRef.modelSetting.getTextureFile(i);

                }else{
                var texPaths = thisRef.modelHomeDir + thisRef.modelSetting.getTextureFile(i);
                }
                thisRef.loadTexture(i, texPaths, function() {

                    if( thisRef.isTexLoaded ) {

                        if (thisRef.modelSetting.getExpressionNum() > 0)
                        {

                            thisRef.expressions = {};

                            for (var j = 0; j < thisRef.modelSetting.getExpressionNum(); j++)
                            {
                                var expName = thisRef.modelSetting.getExpressionName(j);
                                var expFilePath = thisRef.modelHomeDir +
                                    thisRef.modelSetting.getExpressionFile(j);

                                thisRef.loadExpression(expName, expFilePath);
                            }
                        }
                        else
                        {
                            thisRef.expressionManager = null;
                            thisRef.expressions = {};
                        }



                        if (thisRef.eyeBlink == null)
                        {
                            thisRef.eyeBlink = new L2DEyeBlink();
                        }


                        if (thisRef.modelSetting.getPhysicsFile() != null)
                        {
                            thisRef.loadPhysics(thisRef.modelHomeDir +
                                                thisRef.modelSetting.getPhysicsFile());
                        }
                        else
                        {
                            thisRef.physics = null;
                        }



                        if (thisRef.modelSetting.getPoseFile() != null)
                        {
                            thisRef.loadPose(
                                thisRef.modelHomeDir +
                                thisRef.modelSetting.getPoseFile(),
                                function() {
                                    thisRef.pose.updateParam(thisRef.live2DModel);
                                }
                            );
                        }
                        else
                        {
                            thisRef.pose = null;
                        }



                        if (thisRef.modelSetting.getLayout() != null)
                        {
                            var layout = thisRef.modelSetting.getLayout();
                            if (layout["width"] != null)
                                thisRef.modelMatrix.setWidth(layout["width"]);
                            if (layout["height"] != null)
                                thisRef.modelMatrix.setHeight(layout["height"]);

                            if (layout["x"] != null)
                                thisRef.modelMatrix.setX(layout["x"]);
                            if (layout["y"] != null)
                                thisRef.modelMatrix.setY(layout["y"]);
                            if (layout["center_x"] != null)
                                thisRef.modelMatrix.centerX(layout["center_x"]);
                            if (layout["center_y"] != null)
                                thisRef.modelMatrix.centerY(layout["center_y"]);
                            if (layout["top"] != null)
                                thisRef.modelMatrix.top(layout["top"]);
                            if (layout["bottom"] != null)
                                thisRef.modelMatrix.bottom(layout["bottom"]);
                            if (layout["left"] != null)
                                thisRef.modelMatrix.left(layout["left"]);
                            if (layout["right"] != null)
                                thisRef.modelMatrix.right(layout["right"]);
                        }

                        for (var j = 0; j < thisRef.modelSetting.getInitParamNum(); j++)
                        {

                            thisRef.live2DModel.setParamFloat(
                                thisRef.modelSetting.getInitParamID(j),
                                thisRef.modelSetting.getInitParamValue(j)
                            );
                        }

                        for (var j = 0; j < thisRef.modelSetting.getInitPartsVisibleNum(); j++)
                        {

                            thisRef.live2DModel.setPartsOpacity(
                                thisRef.modelSetting.getInitPartsVisibleID(j),
                                thisRef.modelSetting.getInitPartsVisibleValue(j)
                            );
                        }



                        thisRef.live2DModel.saveParam();
                        // thisRef.live2DModel.setGL(gl);


                        thisRef.preloadMotionGroup(cDefine.MOTION_GROUP_IDLE);
                        thisRef.mainMotionManager.stopAllMotions();

                        thisRef.setUpdating(false);
                        thisRef.setInitialized(true);

                        if (typeof callback == "function") callback();

                    }
                });
            }
        });
    });
};



cModel.prototype.release = function(gl)
{
    // this.live2DModel.deleteTextures();
    var pm = Live2DFramework.getPlatformManager();

    gl.deleteTexture(pm.texture);
}



cModel.prototype.preloadMotionGroup = function(name)
{
    var thisRef = this;

    for (var i = 0; i < this.modelSetting.getMotionNum(name); i++)
    {
        var file = this.modelSetting.getMotionFile(name, i);
        this.loadMotion(file, this.modelHomeDir + file, function(motion) {
            motion.setFadeIn(thisRef.modelSetting.getMotionFadeIn(name, i));
            motion.setFadeOut(thisRef.modelSetting.getMotionFadeOut(name, i));
        });

    }
}


cModel.prototype.update = function()
{
    // console.log("--> cModel.update()");


    if(this.live2DModel == null)
    {
        if (cDefine.DEBUG_LOG) console.error("Failed to update.");

        return;
    }

    var timeMSec = UtSystem.getUserTimeMSec() - this.startTimeMSec;
    var timeSec = timeMSec / 1000.0;
    var t = timeSec * 2 * Math.PI;


    if (this.mainMotionManager.isFinished())
    {
        this.startRandomMotion(cDefine.MOTION_GROUP_IDLE, cDefine.PRIORITY_IDLE);
    }

    //-----------------------------------------------------------------


    this.live2DModel.loadParam();



    var update = this.mainMotionManager.updateParam(this.live2DModel);
    if (!update || this.isDefaultIdle) {
        if(this.eyeBlink != null) {
            this.eyeBlink.updateParam(this.live2DModel);
        }
    }


    this.live2DModel.saveParam();

    //-----------------------------------------------------------------

    if (this.expressionManager != null &&
        this.expressions != null &&
        !this.expressionManager.isFinished())
    {
        this.expressionManager.updateParam(this.live2DModel);
    }

    //-----------------------------------------------------------------

    if (this.isDefaultIdle) {
        if (!this.weight) {
            this.weight = 1
        }
        else if (this.weight < 25) {
            this.weight++
        }
    }
    else {
        if (this.weight >= 1) {
            this.weight--
        }
        else {
            this.weight = 0
        }
    }

    const dragWeight = this.weight * 0.04

    if (this.orient) {
        // document.querySelector("#msg").innerHTML = `alpha: ${this.orient.alpha.toFixed(2)} beta: ${this.orient.beta.toFixed(2)} gamma: ${this.orient.gamma.toFixed(2)}`
        // document.querySelector("#msg1").innerHTML = `alpha: ${this.orientOffset.alpha.toFixed(2)} beta: ${this.orientOffset.beta.toFixed(2)} gamma: ${this.orientOffset.gamma.toFixed(2)}`
        this.live2DModel.addToParamFloat('PARAM_ANGLE_X', -this.orientOffset.gamma, dragWeight)
        this.live2DModel.addToParamFloat('PARAM_ANGLE_Y', this.orientOffset.beta, dragWeight)
        // this.live2DModel.addToParamFloat('PARAM_ANGLE_Z', this.orientOffset.gamma * this.orientOffset.beta, 1)
        this.live2DModel.addToParamFloat('PARAM_BODY_ANGLE_X', -this.orientOffset.gamma / 30 * 8, dragWeight)
        // this.live2DModel.addToParamFloat('PARAM_EYE_BALL_X', this.orientOffset.gamma / 30, 1)
        // this.live2DModel.addToParamFloat('PARAM_EYE_BALL_Y', -this.orientOffset.beta / 30, 1)
    }

    this.live2DModel.addToParamFloat("PARAM_ANGLE_X", this.dragX * 32, Math.min(0.4 + dragWeight, 1));
    this.live2DModel.addToParamFloat("PARAM_ANGLE_Y", this.dragY * 28, Math.min(0.2 + dragWeight, 1));
    this.live2DModel.addToParamFloat("PARAM_ANGLE_Z", (this.dragX * this.dragY) * -30, dragWeight);
    this.live2DModel.addToParamFloat("PARAM_BODY_ANGLE_X", this.dragX * 8, Math.min(0.1 + dragWeight, 1));
    this.live2DModel.addToParamFloat("PARAM_EYE_BALL_X", this.dragX, dragWeight);
    this.live2DModel.addToParamFloat("PARAM_EYE_BALL_Y", this.dragY, dragWeight);

    const autoWeight = this.weight * 0.02
    this.live2DModel.addToParamFloat("PARAM_ANGLE_X",
        Number((15 * Math.sin(t / 6.5345))), autoWeight);
    this.live2DModel.addToParamFloat("PARAM_ANGLE_Y",
        Number((8 * Math.sin(t / 3.5345))), autoWeight);
    this.live2DModel.addToParamFloat("PARAM_ANGLE_Z",
        Number((10 * Math.sin(t / 5.5345))), autoWeight);
    this.live2DModel.addToParamFloat("PARAM_BODY_ANGLE_X",
        Number((4 * Math.sin(t / 15.5345))), autoWeight);
    // this.live2DModel.setParamFloat("PARAM_BREATH",
    //     Number((0.5 + 0.5 * Math.sin(t / 3.2345))), 1);


    //-----------------------------------------------------------------


    if (this.physics != null)
    {
        this.physics.updateParam(this.live2DModel);
    }


    if (this.lipSync == null)
    {
        this.live2DModel.setParamFloat("PARAM_MOUTH_OPEN_Y",
                                       this.lipSyncValue);
    }


    if( this.pose != null ) {
        this.pose.updateParam(this.live2DModel);
    }

    this.live2DModel.update();
};



cModel.prototype.setRandomExpression = function()
{
    if (!this.isDefaultIdle && !this.mainMotionManager.isFinished()) {
        return
    }

    var tmp = [];
    for (var name in this.expressions)
    {
        tmp.push(name);
    }

    var no = parseInt(Math.random() * tmp.length);

    this.setExpression(tmp[no]);

    // const motion = L2DExpressionMotion.loadJsonData({
    //     type: 'Live2D Expression',
    //     fade_in: 500,
    //     fade_out: 500,
    //     params:
    //         [
    //             // { id: "PARAM_ANGLE_X", val: range(-30, 30) },
    //             // { id: "PARAM_EYE_BALL_X", val: range(-1, 1) },
    //             // { id: "PARAM_EYE_BALL_Y", val: range(-1, 1) },
    //             { id: "ParamBrowLY", val: range(-1.0, 1.0) },
    //             { id: "ParamBrowRY", val: range(-1, 1) },
    //             { id: "ParamBrowLX", val: range(-1, 1) },
    //             { id: "ParamBrowRX", val: range(-1, 1) },
    //             { id: "ParamBrowLAngle", val: range(-1, 1) },
    //             { id: "ParamBrowRAngle", val: range(-1, 1) },
    //             { id: "ParamBrowRForm", val: range(-1, 1) },
    //             { id: "ParamBrowLForm", val: range(-1, 1) },
    //             // { id: "PARAM_MOUTH_OPEN_Y", val: sample([0, 1]) },
    //             { id: "PARAM_MOUTH_FORM", val: sample([-1, 0, 1]) },
    //         ]
    // })

    // console.log(motion)

    // this.expressionManager.startMotion(motion, false)

    // setTimeout(() => {
    //     this.expressionManager.startMotion(this.expressions['f01.exp.json'], false)
    // }, 4000)
}



cModel.prototype.startRandomMotion = function(name, priority)
{
    const max = this.modelSetting.getMotionNum(name);

    const no = (() => {
        switch (name) {
            case cDefine.MOTION_GROUP_IDLE:
                return !this.isDefaultIdle ? 0 : parseInt(Math.random() * max)
            case cDefine.MOTION_GROUP_TAP_BODY:
            default:
                this.expressionManager.startMotion(this.expressions['f01.exp.json'], false)
                return parseInt(Math.random() * max)
        }
    })()
    
    this.startMotion(name, no, priority);
}



cModel.prototype.startMotion = function(name, no, priority)
{
    // console.log("startMotion : " + name + " " + no + " " + priority);

    var motionName = this.modelSetting.getMotionFile(name, no);

    if (motionName == null || motionName == "")
    {
        // if (cDefine.DEBUG_LOG)
        //     console.error("Failed to motion.");
        return;
    }

    if (priority == cDefine.PRIORITY_FORCE)
    {
        this.mainMotionManager.setReservePriority(priority);
    }
    else if (!this.mainMotionManager.reserveMotion(priority))
    {
        if (cDefine.DEBUG_LOG)
            console.log("Motion is running.")
        return;
    }

    var thisRef = this;
    var motion;

    if (this.motions[name] == null)
    {
        this.currentMotionGroup = name
        this.isDefaultIdle = name === cDefine.MOTION_GROUP_IDLE && no === 0

        this.loadMotion(null, this.modelHomeDir + motionName, function(mtn) {
            motion = mtn;

            thisRef.setFadeInFadeOut(name, no, priority, motion);

        });
    }
    else
    {
        motion = this.motions[name];


        thisRef.setFadeInFadeOut(name, no, priority, motion);
    }
}


cModel.prototype.setFadeInFadeOut = function(name, no, priority, motion)
{
    var motionName = this.modelSetting.getMotionFile(name, no);

    motion.setFadeIn(this.modelSetting.getMotionFadeIn(name, no));
    motion.setFadeOut(this.modelSetting.getMotionFadeOut(name, no));


    if (cDefine.DEBUG_LOG)
            console.log("Start motion : " + motionName);

    if (this.modelSetting.getMotionSound(name, no) == null)
    {
        this.mainMotionManager.startMotionPrio(motion, priority);
    }
    else
    {
        var soundName = this.modelSetting.getMotionSound(name, no);
        // var player = new Sound(this.modelHomeDir + soundName);

        var snd = document.createElement("audio");
        snd.src = this.modelHomeDir + soundName;

        if (cDefine.DEBUG_LOG)
            console.log("Start sound : " + soundName);

        snd.play();
        this.mainMotionManager.startMotionPrio(motion, priority);
    }
}



cModel.prototype.setExpression = function(name)
{
    var motion = this.expressions[name];

    console.log(motion)

    if (cDefine.DEBUG_LOG)
        console.log("Expression : " + name);

    this.expressionManager.startMotion(motion, false);
}



cModel.prototype.draw = function(gl)
{
    //console.log("--> cModel.draw()");

    // if(this.live2DModel == null) return;


    MatrixStack.push();

    MatrixStack.multMatrix(this.modelMatrix.getArray());

    this.tmpMatrix = MatrixStack.getMatrix()
    this.live2DModel.setMatrix(this.tmpMatrix);
    this.live2DModel.draw();

    MatrixStack.pop();

};



cModel.prototype.hitTest = function(id, testX, testY)
{
    var len = this.modelSetting.getHitAreaNum();
    for (var i = 0; i < len; i++)
    {
        if (id == this.modelSetting.getHitAreaName(i))
        {
            var drawID = this.modelSetting.getHitAreaID(i);

            return this.hitTestSimple(drawID, testX, testY);
        }
    }

    return false;
}

cModel.prototype.setRotationRate = function (rate) {
    this.rotationRate = rate
}

cModel.prototype.setOrient = function (alpha, beta, gamma) {
    // this.timeout && clearTimeout(this.timeout)

    if (!this.initialOrient) {
        this.initialOrient = { alpha, beta, gamma }
    }

    this.lastOrient = this.orient ? { ...this.orient } : { ...this.initialOrient }
    this.orient = { alpha, beta, gamma }

    const diff = {
        alpha: alpha - this.lastOrient.alpha,
        beta: beta - this.lastOrient.beta,
        gamma: gamma - this.lastOrient.gamma
    }
    const rate = {
        alpha: diff.alpha > 180 ? diff.alpha - 360 : (diff.alpha < -180 ? diff.alpha + 360 : diff.alpha),
        beta: diff.beta > 180 ? diff.beta - 360 : (diff.beta < -180 ? diff.beta + 360 : diff.beta),
        gamma: diff.gamma > 90 ? diff.gamma - 180 : (diff.gamma < -90 ? diff.gamma + 180 : diff.gamma)
    }

    this.orientOffset = {
        alpha: this.orientOffset.alpha + rate.alpha,
        beta: this.orientOffset.beta + rate.beta,
        gamma: this.orientOffset.gamma + rate.gamma
    }

    // this.timeout = setTimeout(() => {
    //     this.setOrient(this.orient.alpha, this.orient.beta, this.orient.gamma)
    // }, 500)
}
