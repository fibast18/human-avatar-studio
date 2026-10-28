const fs=require('fs'), assert=require('assert'), vm=require('vm');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('function commandIntent('),end=html.indexOf('async function generateAI(',start);
assert(start>0&&end>start);
const code=html.slice(start,end)+'\n globalThis.commandIntent=commandIntent;';
const context={};vm.runInNewContext(code,context);
for(const [message,want] of [
 ['dance',true],['dance for me',true],['Can you dance for me?',true],['please smile',true],['walk toward me',true],
 ['wave then dance',false],['Hello!',true],['Good morning Maya',true],['switch to male',true],['tell a joke',true],
 ['Why is the sky blue?',false],['Tell me about walking benefits',false],['How are you learning?',false],
 ['Can you explain how to dance?',false],['What is the meaning of life?',false],['I am sad today',false],
]) assert.equal(context.commandIntent(message),want,message);
console.log('Command intent tests passed.');
