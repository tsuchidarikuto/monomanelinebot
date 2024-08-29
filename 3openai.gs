function callOpenAIAPI(prompt,systemPrompt){
  const headers={
    "Content-Type": "application/json",
    "Authorization":"Bearer "+ OPENAI_API_KEY
  };

  const payload={
    "model":OPENAI_MODEL,
    "messages":[
      {"role":"system","content":systemPrompt},
      {"role":"user","content": prompt}],
  };

  const options={
    "method":"post",
    "headers": headers,
    "payload":JSON.stringify(payload),
    "muteHttpExceptions":true
  };

  const response=UrlFetchApp.fetch(OPENAI_URL,options);
  const responseJson=JSON.parse(response.getContentText());

  if(response.getResponseCode()===200){
    return responseJson.choices[0].message.content;
  } else {
    throw new Error("Error calling OpenAi API"+response.getContentText());
  }

}
  

