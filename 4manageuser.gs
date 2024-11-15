function getUserState(userId){
  const userRow=findUserRow(userId);
  if(userRow===-1){
    return addNewUser(userId);
  }
  return{
    isFileUploaded:USER_DATA.getRange(userRow,5).getValue()===true,
    isAnalyzeCompleted:USER_DATA.getRange(userRow,6).getValue()===true,
    openAISystemPrompt:USER_DATA.getRange(userRow,7).getValue(),
    conversationLog:USER_DATA.getRange(userRow,8).getValue()||""
  };
}

function updateUserState(userId,state){
  const userRow=findUserRow(userId);
  if(userRow!==-1){
    USER_DATA.getRange(userRow,5,1,4).setValues([[
      state.isFileUploaded,
      state.isAnalyzeCompleted,
      state.openAISystemPrompt,
      state.conversationLog
    ]]);
  }
}

function findUserRow(userId){
  const userIds=USER_DATA.getRange("A:A").getValues().flat();
  const index=userIds.findIndex(id=>id===userId);
  return index===-1 ? -1:index+1;
}

function addNewUser(userId){
  const lastRow=USER_DATA.getLastRow();
  USER_DATA.getRange(lastRow+1,1,1,7).setValues([[
    userId,"","","","false","false","null"
  ]]);
  USER_DATA.getDataRange().removeDuplicates([1]);
  return{isFileUploaded:false,isAnalyzeCompleted:false,openAISystemPrompt:"null"};
}

function updateUserProfiles(){
  const lastRow=USER_DATA.getLastRow();
  const userList=USER_DATA.getRange(1,1,lastRow,2).getValues();
  const userInfoList=userList
    .filter(user=>!user[1])
    .map(user=>fetchUserProfile(user[0]));
  
  if(userInfoList.length>0){
    const startRow=lastRow-userInfoList.length+1;
    USER_DATA.getRange(startRow,2,userInfoList.length,3).setValues(userInfoList);
  }
}

function fetchUserProfile(userId){
  const url=`https://api.line.me/v2/bot/profile/${userId}`;
  try{
    const response=UrlFetchApp.fetch(url,{
      headers:{
        "Authorization":"Bearer "+CHANNEL_ACCESS_TOKEN
      }    
    });
    const profile=JSON.parse(response.getContentText());
    return[
      profile.displayName,
      profile.statusMessage,
      profile.pictureUrl
    ];
  }catch(error){
    Logger.log(`Error fetching profile for user ${userId}: ${error}`);
    return ["Not found.", "Not found.", "Not found."];
  }
}

function deleteUserData(userId) {
  const row = findUserRow(userId);
  if (row !== -1) { // 見つからない場合に備えてチェックを追加
    USER_DATA.deleteRow(row);
  } else {
    Logger.log('ユーザーが見つかりませんでした');
  }
}


