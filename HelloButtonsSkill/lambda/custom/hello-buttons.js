'use strict';

const Alexa = require('alexa-sdk');

exports.handler = (event, context) => {
  // standard Alexa Skill Kit initialization
  const alexa = Alexa.handler(event, context);
  alexa.appId = '';
  alexa.registerHandlers(main);
  alexa.execute();
};

const main = {
  'LaunchRequest': function() {
    console.log('LaunchRequest');

    /*
      For this skill, on launch we'll immediately setup the
      input handler to listen to all attached buttons for 30
      seconds.
      We'll setup two events that each report when buttons are
      pressed down and when they're released up.
      After 30 seconds, we'll get the timeout event.
    */
   
  
   /*  Commenting this out for Lab 2

      this.response._addDirective({
      "type": "GameEngine.StartInputHandler",
      "timeout": 30000,
      "recognizers": {
        "button_down_recognizer": {
          type: "match",
          fuzzy: false,
          anchor: "end",
          "pattern": [{
            "action": "down"
          }]
        },
        "button_up_recognizer": {
          type: "match",
          fuzzy: false,
          anchor: "end",
          "pattern": [{
            "action": "up"
          }]
        },
      },
      "events": {
        "button_down_event": {
          "meets": ["button_down_recognizer"],
          "reports": "matches",
          "shouldEndInputHandler": false
        },
        "button_up_event": {
          "meets": ["button_up_recognizer"],
          "reports": "matches",
          "shouldEndInputHandler": false
        },
        "timeout": {
          "meets": ["timed out"],
          "reports": "history",
          "shouldEndInputHandler": true
        }
      }
    });
    */

    /*
      If buttons are awake before we start, we can send
      animations to all of them by targeting the empty array []
    */
    // add new roll Call directive for Lab2
    this.response._addDirective({
      "type": "GameEngine.StartInputHandler",
      "timeout": 10000,
      "comment": "discover exactly two anonymous buttons, or fail",
      "proxies": [ "one", "two"],
      "recognizers": {
        "both_pressed": {
          "type": "match",
          "fuzzy": true,
          "anchor": "start",
          "pattern": [
            {
              "gadgetIds": [ "one" ],
              "action": "down"
            },
            {
              "gadgetIds": [ "two" ],
              "action": "down"
            }
          ]
        }
      },
      "events": {
        "all_in": {
          "meets": [ "both_pressed" ],
          "reports": "matches",
          "shouldEndInputHandler": true
        },
        "timeout": {
          "meets": [ "timed out" ],
          "reports": "history",
          "shouldEndInputHandler": true
        }
      }
    });
    // start keeping track of some state
    this.attributes.buttonCount = 0;

    // build 'idle' breathing animation that will play immediately
    this.response._addDirective(buildButtonIdleAnimationDirective([], breathAnimationRed));

    // build 'button down' animation for when the button is pressed
    this.response._addDirective(buildButtonDownAnimationDirective([]));

    // build 'button up' animation for when the button is released
    this.response._addDirective(buildButtonUpAnimationDirective([]));

    // we'll say something in the standard way
   /* Commenting out for Lab 2 
    this.response.speak("Welcome to Hello Buttons Skill. Press your buttons to change light colors, I'll keep talking so you can interrupt me. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.");
    */

    // New response for lab 2
    this.response.speak('Hi, who is playing? Please press your buttons one at a time');

    // deleting `shouldEndSession` will keep your session open, but NOT open the microphone
    // you could also set `shouldEndSession` to false if you did also want a voice intent
    // never send shouldEndSession true if you're expecting input handler events: you'll lose the session!
    delete this.handler.response.response.shouldEndSession;

    // we use the manual mechanism to end the response, because we've modified the response directly
    this.emit(':responseReady');
  },
  'GameEngine.InputHandlerEvent': function() {
    console.log('Received game event', JSON.stringify(this.event, null, 2));
    let gameEngineEvents = this.event.request.events || [];
    for (let i = 0; i < gameEngineEvents.length; i++) {
      let buttonId;
      // in this request type, we'll see one or more incoming events
      // corresponding to the StartInputHandler we sent above
      switch (gameEngineEvents[i].name) {
          // Adding 'all_in' handler for Lab2
          case 'all_in':
            // build a set of colors to choose from
            var colors = { 'blue': '0000ff', 'green' : '008000'};
            // create placeholder speech string
            var speech = '';
            // iterate through the button events
            for (let j = 0; j < gameEngineEvents[i].inputEvents.length; j++){
              // get the button ID
              buttonId = gameEngineEvents[i].inputEvents[j].gadgetId;
              // log the button ID
              console.log("Found buttonID: " + buttonId );
              // get the first color from the colors object above
              var buttonColor = Object.keys(colors)[j];
              // get the hex code for the button
              var buttonCode = colors[buttonColor];
              // build a breath animation
              var breathAnimation = buildBreathAnimation('000000', buttonCode, 30, 1200);
              // add the animation to the response
              this.response._addDirective(buildButtonIdleAnimationDirective([buttonId], breathAnimation));
              // log what we are doing
              console.log('Setting button[' + buttonId + '] to ' + buttonColor);
              // add to the spoken response by saying 'welcome blue player and welcome green player'
              speech += 'Welcome ' + buttonColor + ' player ';
              if (j == 0){
                speech += ' and ';
              }
            }
            // add the speech to the response
            this.response.speak(speech);
            // lets see what we are returning
            console.log(JSON.stringify(this.handler.response));
            // send the response
            this.emit(':responseReady');     
        case 'button_down_event':

          // id of the button that triggered event
          buttonId = gameEngineEvents[i].inputEvents[0].gadgetId;

          // recognize a new button
          let isNewButton = false;
          if (this.attributes[buttonId + '_initialized'] === undefined) {
            isNewButton = true;
            this.attributes.buttonCount += 1;
            /*
              This is a new button, as in new to our understanding.
              Because this button may have just woken up, it may not
              have received our initial animations during Launch Intent
              we'll resend them here, but instead of the empty array
              broadcast above, here we'll send them ONLY to this buttonId
            */
            this.response._addDirective(buildButtonIdleAnimationDirective([buttonId], breathAnimationRed));
            this.response._addDirective(buildButtonDownAnimationDirective([buttonId]));
            this.response._addDirective(buildButtonUpAnimationDirective([buttonId]));

            this.attributes[buttonId + '_initialized'] = true;
          }

          // again, this means don't end session, and don't open the microphone
          delete this.handler.response.response.shouldEndSession;

          if (isNewButton) {
            // say something when we first encounter a button
            this.response.speak('hello, button ' + this.attributes.buttonCount);

            /*
              Alexa might still be saying something from a previous
              speech response. To get a snappier response here, we can
              ask this response to interrupt the previous one!
            */
            this.handler.response.response.outputSpeech.playBehavior = 'REPLACE_ALL';
          }

          // once more, we finish with this because we've directly manipulated the response
          this.emit(':responseReady');

          break;

        case 'button_up_event':

          buttonId = gameEngineEvents[i].inputEvents[0].gadgetId;

          /*
            On releasing the button, we'll replace the idle animation
            on the button, with a new color from a set of animations
          */
          let newAnimationIndex = ((attributes, buttonId, maxLength) => {
            let index = 1;

            if (attributes[buttonId] !== undefined) {
              let newValue = attributes[buttonId] + 1;
              if (newValue >= maxLength) {
                newValue = 0;
              }
              index = newValue;
            }

            attributes[buttonId] = index;

            return index;
          })(this.attributes, buttonId, animations.length);

          let newAnimation = animations[newAnimationIndex];

          this.response._addDirective(buildButtonIdleAnimationDirective([buttonId], newAnimation));

          delete this.handler.response.response.shouldEndSession;

          this.emit(':responseReady');

          break;

        case 'timeout':

          this.response.speak("Thank you for playing!");

          this.response._addDirective(buttonFadeoutAnimationDirective);

          /*
            Now that we're really done, we actually want to end
            the session and clean up.
          */
          this.handler.response.response.shouldEndSession = true;

          this.emit(':responseReady');

          break;
      }
    }
  },
  /*
    Standard skill intent handling
  */
  'AMAZON.HelpIntent': function() {
    console.log('HelpIntent');
    const msg = 'Welcome to Hello Buttons skill. Press your buttons.';
    this.emit(':tell', msg, msg);
  },
  'AMAZON.StopIntent': function() {
    console.log('StopIntent');
    this.response.speak('Good Bye!');

    this.response._addDirective(buttonFadeoutAnimationDirective);

    this.emit(':responseReady');
  },
  'AMAZON.CancelIntent': function() {
    console.log('CancelIntent');
    this.response.speak('Alright, canceling');

    this.response._addDirective(buttonFadeoutAnimationDirective);

    this.emit(':responseReady');
  },
  'SessionEndedRequest': function() {
    console.log('SessionEndedRequest');
  },
  'System.ExceptionEncountered': function() {
    console.log('ExceptionEncountered');
    console.log(this.event.request.error);
    console.log(this.event.request.cause);
  },
  'Unhandled': function() {
    console.log('Unhandled');
    const msg = "Sorry, I didn't get that.";
    this.emit(':ask', msg, msg);
  }
};

/*
  Here we'll write ourselves a few animation generation function
  that work with the hexadecimal format SetLight expects
*/

const buildBreathAnimation = function(fromRgbHex, toRgbHex, steps, totalDuration) {
  const halfSteps = steps / 2;
  const halfTotalDuration = totalDuration / 2;
  return buildSeqentialAnimation(fromRgbHex, toRgbHex, halfSteps, halfTotalDuration)
    .concat(buildSeqentialAnimation(toRgbHex, fromRgbHex, halfSteps, halfTotalDuration));
}

const buildSeqentialAnimation = function(fromRgbHex, toRgbHex, steps, totalDuration) {
  const fromRgb = parseInt(fromRgbHex, 16);
  let fromRed = fromRgb >> 16;
  let fromGreen = (fromRgb & 0xff00) >> 8;
  let fromBlue = fromRgb & 0xff;

  const toRgb = parseInt(toRgbHex, 16);
  const toRed = toRgb >> 16;
  const toGreen = (toRgb & 0xff00) >> 8;
  const toBlue = toRgb & 0xff;

  const deltaRed = (toRed - fromRed) / steps;
  const deltaGreen = (toGreen - fromGreen) / steps;
  const deltaBlue = (toBlue - fromBlue) / steps;

  const oneStepDuration = Math.floor(totalDuration / steps);

  const result = [];

  for (let i = 0; i < steps; i++) {
    result.push({
      "durationMs": oneStepDuration,
      "color": rgb2h(fromRed, fromGreen, fromBlue),
      "intensity": 255,
      "blend": true
    });
    fromRed += deltaRed;
    fromGreen += deltaGreen;
    fromBlue += deltaBlue;
  }

  return result;
}

const rgb2h = function(r, g, b) {
  return '' + n2h(r) + n2h(g) + n2h(b);
}
// number to hex with leading zeroes
const n2h = function(n) {
  return ('00' + (Math.floor(n)).toString(16)).substr(-2);
}

const breathAnimationRed = buildBreathAnimation('552200', 'ff0000', 30, 1200);
const breathAnimationGreen = buildBreathAnimation('004411', '00ff00', 30, 1200);
const breathAnimationBlue = buildBreathAnimation('003366', '0000ff', 30, 1200);
const animations = [breathAnimationRed, breathAnimationGreen, breathAnimationBlue];


// build 'button down' animation directive
// animation will overwrite default 'button down' animation
const buildButtonDownAnimationDirective = function(targetGadgets) {
  return {
    "type": "GadgetController.SetLight",
    "version": 1,
    "targetGadgets": targetGadgets,
    "parameters": {
      "animations": [{
        "repeat": 1,
        "targetLights": ["1"],
        "sequence": [{
          "durationMs": 300,
          "color": "FFFF00",
          "intensity": 255,
          "blend": false
        }]
      }],
      "triggerEvent": "buttonDown",
      "triggerEventTimeMs": 0
    }
  }
};

// build 'button up' animation directive
const buildButtonUpAnimationDirective = function(targetGadgets) {
  return {
    "type": "GadgetController.SetLight",
    "version": 1,
    "targetGadgets": targetGadgets,
    "parameters": {
      "animations": [{
        "repeat": 1,
        "targetLights": ["1"],
        "sequence": [{
          "durationMs": 300,
          "color": "00FFFF",
          "intensity": 255,
          "blend": false
        }]
      }],
      "triggerEvent": "buttonUp",
      "triggerEventTimeMs": 0
    }
  }
};

// build idle animation directive
const buildButtonIdleAnimationDirective = function(targetGadgets, animation) {
  return {
    "type": "GadgetController.SetLight",
    "version": 1,
    "targetGadgets": targetGadgets,
    "parameters": {
      "animations": [{
        "repeat": 100,
        "targetLights": ["1"],
        "sequence": animation
      }],
      "triggerEvent": "none",
      "triggerEventTimeMs": 0
    }
  }
};

// fadeout animation directive
const buttonFadeoutAnimationDirective = {
  "type": "GadgetController.SetLight",
  "version": 1,
  "targetGadgets": [],
  "parameters": {
    "animations": [{
      "repeat": 1,
      "targetLights": ["1"],
      "sequence": [{
        "durationMs": 1,
        "color": "FFFFFF",
        "intensity": 255,
        "blend": true
      }, {
        "durationMs": 1000,
        "color": "000000",
        "intensity": 255,
        "blend": true
      }]
    }],
    "triggerEvent": "none",
    "triggerEventTimeMs": 0
  }
};




