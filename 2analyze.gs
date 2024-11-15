const PROMPT_FOR_ANALYZE=`#命令
-あなたは優秀な言語分析AIです。{#作成したいアプリ}を作るために、{#inputessage}を分析し、{#抽出要素}に従ってJSON形式で出力してください。{#出力形式}に含まれる要素をすべて抽出しなさい。ただし、{#sampledata}はユーザとものまね対象者の会話サンプルです
-特に{#ものまね対象者}が使う一人称の抽出と二人称の抽出に力を注いで
-{#ユーザとの関係}の推測に一番尽力しなさい

#作成したいアプリ
-ユーザーから入力されたファイルをopenaiapiで分析し、その結果を使ってものまねをするlinebot

#抽出要素
-各パラメータの形式は{type}に従うこと.ただし{type}の部分は出力に含めない

＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
 #全体的な特徴{text}:
 #{ものまね対象者}の一人称{text}:
 #{#ものまね対象者)がユーザを何と呼ぶか（特定できなかった場合はこの行ごと削除する）{text}:
 #1文の長さ{type:number}:
 #ユーザとの関係{text}:
 #特有の語彙{text}:
 #方言の有無、種類{text}:
 #特徴的な語尾{text}(5個):
 #使用するスラング{text}:
 #感情表現の強さ{type:number}:
 #よく使う絵文字、顔文字{type:emoji}:
 #絵文字の頻度(%){type:number}:
 #趣味{text}:
 #楽しいときに使う語尾("笑"or"w"or"(笑)"or null):
 #その他のペルソナ情報:
 #{#ものまね対象者)のセリフ、口調の例:
 #{#ものまね対象者)の行動指針:
＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝`
;

function analyzeTalkData(talkdata,name){
  const {arrText,sampledata}=arrangeText(talkdata,name);
  const inputForAna = "#inputmessage\n" + arrText + "#sample\n" + sampledata;

  return `あなたは${name}です. {#prompt}を参照し、${name}になりきって。\n
  -必ず#1文の長さ}を出力token数に反映させて。\n
  -{#使用するスラング}や{#特徴的な語尾}の無理な使用は避け、自然かつ流暢な会話を優先させて\n
  -{#ユーザとの関係}を十分に考慮した出力にして\n
  -"BOT:"の様な文字列は出力に含めないで`+
  "\n#prompt\n"+callOpenAIAPI(inputForAna,PROMPT_FOR_ANALYZE);
  
}

function arrangeText(text, name) {
  let lines = text.split('\n');
  lines = lines.slice(2);
  
  let processedLines = lines.filter(line => {
    line = line.trim();
    const includesName = line.includes(name.trim());
    return includesName;
  });

  processedLines=processedLines.map(line=>{
    line =line.replace(/\d{2}:\d{2}\t/,"");
    line=line.replace(name,"");
    return line.trim();
  });
  processedLines = processedLines.slice(Math.max(processedLines.length - 400, 0));

  const sampledata=lines.slice(-20).join("\n");

  return {
    arrText:processedLines.join("\n") ,
    sampledata: sampledata
  };
}