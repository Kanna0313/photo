document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('image-input').addEventListener('change', handleImageUpload);
    document.getElementById('evaluate-button').addEventListener('click', evaluateImage);
    document.getElementById('retake-button').addEventListener('click', retakeImage);
    document.getElementById('complete-button').addEventListener('click', completeProcess);
});

function handleImageUpload(event) {
    const imageContainer = document.getElementById('image-container');
    //const chatBox = document.getElementById('chat-box'); // チャットボックスをクリアしない
    imageContainer.innerHTML = '';
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            imageContainer.appendChild(img);
            document.getElementById('evaluate-button').style.display = 'inline-block';
        }
        reader.readAsDataURL(file);
    }
}


async function evaluateImage() {
    const imageContainer = document.getElementById('image-container');
    if (!imageContainer.firstChild) return;

    const imageData = imageContainer.firstChild.src.split(',')[1]; // Base64部分のみ取得

    appendMessage('ChatGPT', '画像を評価しています...');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `` // ここにあなたのOpenAI APIキーを入力してください
            },
            body: JSON.stringify({
                model: 'gpt-4o', // もしくは使用したいモデル名
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'この画像には何が写っていますか？' },
                            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageData}` } }
                        ]
                    },
                    {
                        role: 'user',
                        content: 'この画像の構図を100点満点で評価し、より良い写真にがとれるように構図に関するアドバイス(例：被写体に近づいて、右に移動して)を一言でください。'
                    }
                ],
                max_tokens: 500
            })
        });

        if (!response.ok) {
            if (response.status === 429) {
                appendMessage('ChatGPT', 'リクエストが多すぎます。少し待ってからもう一度お試しください。');
            } else {
                appendMessage('ChatGPT', `エラーが発生しました。ステータスコード: ${response.status}`);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const advice = data.choices[0].message.content.split('\n').map(line => line.trim());
            const score = advice[0].replace('点数: ', ''); // 点数を取得
            const suggestion = advice.slice(1).join(' '); // アドバイスを取得
            appendMessage('ChatGPT', `点数: ${score}\nアドバイス: ${suggestion}`);
            
            // 画像をチャットボックスに追加
            const imgElement = document.createElement('img');
            imgElement.src = `data:image/jpeg;base64,${imageData}`;
            imgElement.style.maxWidth = '250px';
            appendMessage('Image', imgElement.outerHTML);
        } else {
            appendMessage('ChatGPT', '評価結果を取得できませんでした。');
        }

        document.getElementById('retake-button').style.display = 'inline-block';
        document.getElementById('complete-button').style.display = 'inline-block';
        document.getElementById('evaluate-button').style.display = 'none';
    } catch (error) {
        console.error('Error:', error);
    }
}


function retakeImage() {
    document.getElementById('image-input').value = '';
    document.getElementById('image-container').innerHTML = '';
    document.getElementById('retake-button').style.display = 'none';
    document.getElementById('complete-button').style.display = 'none';
    document.getElementById('evaluate-button').style.display = 'none';
}


function completeProcess() {
    appendMessage('ChatGPT', 'お疲れさまでした！');
    document.getElementById('retake-button').style.display = 'none';
    document.getElementById('complete-button').style.display = 'none';
    document.getElementById('image-input').value = '';
    document.getElementById('image-container').innerHTML = '';
}

function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}
