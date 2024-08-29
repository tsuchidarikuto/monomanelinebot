const CHANNEL_ACCESS_TOKEN=PropertiesService.getScriptProperties().getProperty("LINE_TOKEN");
const line_endpoint="https://api.line.me/v2/bot/message/reply"

const OPENAI_API_KEY=PropertiesService.getScriptProperties().getProperty("OPENAI_APIKEY");
const OPENAI_MODEL="gpt-4o-mini";
const OPENAI_URL="https://api.openai.com/v1/chat/completions"

const SHEET_ID="1q4ar8R7dkypgB9pYsHESJEmyz7EehOckeGHw9thfzGM";
const USER_DATA=SpreadsheetApp.openById(SHEET_ID).getSheets()[0];



function doPost(e){
  const EVENTS=JSON.parse(e.postData.contents).events;
  Logger.log(EVENTS);
  for(const event of EVENTS){
    execute(event);
  }
}

function execute(event){
  const EVENT_TYPE=event.type;
  const USER_ID=event.source.userId;
  const REPLY_TOKEN=event.replyToken;
  
  if(typeof REPLY_TOKEN==='undefined'){
    return;
  }
  const userState=getUserState(USER_ID);
  
  if(EVENT_TYPE==="follow"){
    eve_follow(REPLY_TOKEN,USER_ID);
  }
  else if(EVENT_TYPE==="message"){
    if(event.message.type==="text"){
      
      let text =event.message.text;

      if(text==="リセット"){
       resetParam(USER_ID);
       sendReplyMessage(REPLY_TOKEN,"リセットするよ！\n\nもう一度遊びたい時はファイルを送信してね！"); 
      }else if(userState.isFileUploaded===false){
        sendReplyMessage(REPLY_TOKEN,"ものまねをするための学習データがないよ🥺\n真似してほしい人とのトーク画面を開いて\n 1.右上の三本線\n 2.設定\n 3.トーク履歴を送信 \nで作成されるファイルをここに送ってね！");
      }else if(userState.isAnalyzeCompleted===false){
        replyAsMonomane(REPLY_TOKEN,"トークを分析中だよ！もうちょっと待っててね！");
      }else{
        replyAsMonomane(REPLY_TOKEN,text,userState.openAISystemPrompt);
      }
      
    }
    else if (event.message.type==="file"){
      if(userState.isFileUploaded===false){
        userState.isFileUploaded=true;
        let fileId=event.message.id;
        let fileName=event.message.fileName;
        let name=fileName.replace(/とのトーク.txt|\s|のトーク.txt|\[LINE\]/g,"");
        name = name.normalize("NFC");
        sendReplyMessage(REPLY_TOKEN,`ありがとう！  \n${name}の話し方を分析するよ！\nちょっと待っててね！`);
      
        const filetext=getFileContent(fileId);
        userState.  openAISystemPrompt=analyzeTalkData(filetext,name);
        userState.isAnalyzeCompleted=true;
        updateUserState(USER_ID,userState);
        sendPushMessage("分析が完了したよ！なにか話しかけてみて！",USER_ID);
         Logger.log(`${IS_FILE_UPLOADED}`);
      }else{
        sendReplyMessage(REPLY_TOKEN,"既に別の人になりきり中だよ！\n違う人で遊びたい時は「リセット」って送ってからファイルをアップロードしてね！")
      }
    }
  }
}

function eve_follow(replyToken,userId){
  addNewUser(userId);
  updateUserProfiles();
  sendWelcomeMessage(replyToken);
}

function sendWelcomeMessage(replyToken){
 const desc_message=`こんにちは！友達追加ありがとうございます\n
  このボットは特定の人物の会話パターンを学習し、そのスタイルで返信することができます。\n
  使い方：
  1. トーク画面右上の三本線→設定→トーク履歴を送信 で作成されたトーク履歴を参照して真似してほしい人物のトークをテキスト化します。
  2. そのテキストをこのボットのトーク画面に貼り付けてください。
  3. これ以降、ボットはその人物のスタイルでメッセージを返信します。\n
  ※「リセット」と送信すると、元の設定に戻ります。`;
  sendReplyMessage(replyToken,desc_message);
}

function getFileContent(fileid){
  const fileurl='https://api-data.line.me/v2/bot/message/' + fileid + '/content';
  
  const options={
    "method":"get",
    "headers":{
      "Authorization":"Bearer "+CHANNEL_ACCESS_TOKEN
    }
  };
  try{
    const response=UrlFetchApp.fetch(fileurl,options);
    const content=response.getContent();

    const text=Utilities.newBlob(content).getDataAsString();
    return text;
  } catch (error){
    Logger.log("Error: "+error);
    return null;
  }
  
}

function replyAsMonomane(REPLY_TOKEN,text,systemprompt){
  const result=callOpenAIAPI(text,systemprompt);
  sendReplyMessage(REPLY_TOKEN,result);
}

function resetParam(userId) {
  const userState = {
    isFileUploaded: false,
    isAnalyzeCompleted: false,
    openAISystemPrompt: "null"
  };
  updateUserState(userId, userState);
}

function sendReplyMessage(replyToken,TextMessage){
  try {
    const RES=UrlFetchApp.fetch(line_endpoint,{
      "headers":{
        "Content-Type":"application/json; charset=UTF-8",
        "Authorization":"Bearer " + CHANNEL_ACCESS_TOKEN,
      },
      "method":"post",
      "payload": JSON.stringify({
        "replyToken":replyToken,
        "messages":[{
          "type": "text",
          "text": TextMessage,
        }],
      }),
    });
    Logger.log(`Message sent successfully: ${TextMessage}`);
    return RES;
  } catch (error) {
    Logger.log(`Error sending message: ${error.toString()}`);
    return null;
  }
}

function sendPushMessage(text,to){
  const URLPUSH="https://api.line.me/v2/bot/message/push";
  try{
    const PES=UrlFetchApp.fetch(URLPUSH,{
      "headers":{
        "Content-Type":"application/json; charset=UTF-8",
        "Authorization":"Bearer "+CHANNEL_ACCESS_TOKEN,
      },
      "method":"post",
      "payload":JSON.stringify({
        "to":to,
        "messages":[
          {
            "type":"text",
            "text":text,
          }
        ]
      })     
    });
    return PES;
  }catch(error){
    Logger.log(`Error pushing message: ${error.toString()}`);
    return null;
  }

}