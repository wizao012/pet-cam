# ペットCAM 公開用ファイル

承認済みv24のデザイン・FV・自然な犬猫の3画像を収録。
GTM-KMR3S26Kを全5ページに設置。指定Zapier Webhookへの送信は有効です。
フォームは地域プルダウン、郵便番号から住所補完、建物名・部屋番号は任意。お知らせ配信なし。

## GitHubとCloudflare Pages
このフォルダの中身をGitHubリポジトリの直下へ配置。
Production branch: main
Framework preset: None
Build command: npm run build
Build output directory: dist
Root directory: 空欄
Environment variable: NODE_VERSION=22

npm testで外部通信なしの検証、npm run buildで公開用distを生成。
Cloudflare直接アップロード用ZIPはビルド不要、そのままアップロードできます。

## 構成
index.html / fv-alt.html / company.html / privacy.html / thanks.html
assets/css / assets/js / assets/vendor / assets/fonts / 画像素材
scripts: ビルド、テスト、Zapier整形コード（公開distには含まれません）

## 連携
LEAD-SETUP.txtを参照。Zapier・GTM管理画面での設定／受信確認は未実施。
フォームはno-cors + FormData方式で、ブラウザから受信成功のHTTPステータスは確認できません。
form_submit_cvは送信要求完了時に発火。サンクスPVとの二重計測を避けてください。
氏名・電話・住所等はdataLayerに含めません。
再送時のsubmission_idでZapier側の重複除外を設定してください。

本番トップページのnoindexは解除、サンクスとFV別ページはnoindexを維持。
今回GitHubへのpush、Cloudflare公開、実リードの送信は行っていません。
確認用chatgpt.siteは送信停止のままで、この公開用ファイルとは設定が異なります。
