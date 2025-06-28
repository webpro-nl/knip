local home = os.getenv("HOME")
local knip = home .. "/p/knip/knip"
local demo = knip .. "/templates/demo/monorepo"

local screen = hs.screen.allScreens()[1]
local stageEnterDelay = 1;
local stageExitDelay = 0.5;
local typeSpeedNormal = 0.05;
local typeSpeedFast = 0.01;

-- Keys

local function pressReturn()
  hs.eventtap.keyStroke({}, "return")
end

local function pressDown()
  hs.eventtap.keyStroke({}, "down")
end

local function saveFile()
  hs.eventtap.keyStroke({ "cmd" }, "S")
end

local function stopRecording()
  hs.eventtap.keyStroke({ "ctrl", "cmd" }, "escape")
end

-- Generic helpers

local function runInSequence(tasks)
  local index = 1
  local function runNextTask()
    if index <= #tasks then
      local currentTask = tasks[index]
      index = index + 1
      currentTask(runNextTask)
    end
  end
  runNextTask()
end

local function typeText(text, speed, callback)
  local index = 1
  hs.timer.doUntil(function()
    return index > #text
  end, function()
    hs.eventtap.keyStrokes(text:sub(index, index))
    index = index + 1
    if index > #text and callback then
      hs.timer.doAfter(0.3, function()
        pressReturn()
        callback()
      end)
    end
  end, speed)
end

-- Stage helpers

local function showMessage(text)
  local id = hs.alert.show(text, screen, s2, 20)
  return function()
    hs.alert.closeSpecific(id, 2)
  end
end

local function leaveStage(close, done)
  hs.timer.doAfter(stageExitDelay, function()
    close()
    hs.timer.doAfter(stageExitDelay, function()
      done()
    end)
  end)
end

local function enterStage(done, text, fn)
  local close = showMessage(text)
  hs.timer.doAfter(stageEnterDelay, function()
    if fn then
      fn(function()
        leaveStage(close, done);
      end)
    else
      leaveStage(close, done);
    end
  end)
end

-- VS Code helpers

local function toFileStart()
  hs.eventtap.keyStroke({ "cmd" }, "up")
end

local function goToTerminal()
  hs.eventtap.keyStroke({ "ctrl" }, "`")
end

function openVSCodeWithFile(filePath, done)
  hs.execute("code " .. filePath, true)
  hs.timer.doAfter(stageEnterDelay, done);
end

-- Stages

local function init(done)
  hs.execute("code ", true)
  hs.eventtap.keyStroke({ "cmd", "shift" }, "0")
  hs.eventtap.keyStroke({ "cmd" }, "=")
  hs.eventtap.keyStroke({ "cmd" }, "=")
  hs.eventtap.keyStroke({ "cmd" }, "=")
  enterStage(done, "✂️ demo\n\nknip --watch\nknip --fix", function(cb)
    openVSCodeWithFile(demo .. "/packages/shared/src/exports.ts", cb);
  end)
end

local function startWatcher(done)
  enterStage(done, "First up: start the watcher", function(cb)
    goToTerminal()
    hs.timer.doAfter(stageEnterDelay, function()
      typeText("knip --watch", typeSpeedNormal, cb)
    end);
  end)
end

local function addUnusedExports(done)
  enterStage(done, "Excellent, let's add some unused exports...", function(cb)
    openVSCodeWithFile(
      demo .. "/packages/shared/src/exports.ts",
      function()
        pressReturn()
        typeText("export const UNUSED_EXPORT = 1;", typeSpeedFast, function()
          saveFile();
          pressReturn()
          typeText("export interface UNUSED_INTERFACE {}", typeSpeedFast, function()
            saveFile()
            cb()
          end)
        end)
      end)
  end)
end

local function addUnlistedDependency(done)
  enterStage(done, "Import an unlisted dependency...", function(cb)
    openVSCodeWithFile(
      demo .. "/packages/server/src/index.ts",
      function()
        toFileStart();
        pressDown()
        saveFile();
        typeText("import { something } from 'not-in-package-json';", typeSpeedFast, function()
          saveFile();
          cb()
        end)
      end)
  end)
end

local function undoUnlistedDependency(done)
  enterStage(done, "...and get rid of it", function(cb)
    toFileStart();
    pressDown();
    hs.eventtap.keyStroke({ "cmd", "shift" }, "K")
    saveFile();
    cb()
  end)
end

local function splitTerminal(done)
  goToTerminal()
  hs.eventtap.keyStroke({ "cmd" }, "\\")
  hs.timer.doAfter(stageEnterDelay, done);
end

local function createFiles(done)
  enterStage(done, "Let's create some new files", function(cb)
    typeText("touch packages/client/unused-file.js", typeSpeedFast, function()
      typeText("touch packages/server/unused-as-well.js", typeSpeedFast, cb)
    end)
  end)
end

local function messageUnusedFiles(done)
  enterStage(done, "Now we have some unused files and exports...", function(cb)
    openVSCodeWithFile(
      demo .. "/packages/server/src/index.ts",
      function()
        goToTerminal()
        cb()
      end)
  end)
end

local function backToFirstFile(done)
  enterStage(done, "Let's go back to the other package in the monorepo...", function(cb)
    openVSCodeWithFile(demo .. "/packages/shared/src/exports.ts", cb)
  end)
end

local function cleanupUsingAutoFix(done)
  enterStage(done, "...and clean this up! ✂️", function(cb)
    goToTerminal()
    pressReturn()
    typeText("knip --fix --allow-remove-files", typeSpeedNormal, function()
      hs.timer.doAfter(stageEnterDelay, function()
        hs.eventtap.keyStroke({ "option" }, "Z")
        cb();
      end);
    end);
  end);
end

local function endMessage(done)
  enterStage(done, "That's it, thanks for watching!")
end

local function stop(done)
  hs.timer.doAfter(stageEnterDelay, function()
    stopRecording()
    done();
  end);
end

-- Set & run stages

local stages = {
  init,
  startWatcher,
  addUnusedExports,
  addUnlistedDependency,
  undoUnlistedDependency,
  splitTerminal,
  createFiles,
  messageUnusedFiles,
  backToFirstFile,
  cleanupUsingAutoFix,
  endMessage,
  stop
}

runInSequence(stages)
