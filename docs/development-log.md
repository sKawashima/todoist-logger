# Todoist Logger 開発ログ

**作業開始日: 2025-07-25**

## 概要
TodoistのAPIを使用して、指定日付に完了したタスクをMarkdown形式で取得し、Obsidianプラグインとして実装するプロジェクト。

## API調査結果

### Todoist APIの制約
1. **REST API v2の制限**
   - 完了タスクの取得はサポートされていない
   - アクティブなタスクのみ取得可能

2. **Sync API v9の使用**
   - 完了タスクの取得が可能
   - エンドポイント: `https://api.todoist.com/sync/v9/completed/get_all`
   - パラメータ:
     - `since`: 開始日時（ISO 8601形式）
     - `until`: 終了日時（ISO 8601形式）

### API呼び出し例
```bash
curl "https://api.todoist.com/sync/v9/completed/get_all?since=2025-07-24T00:00&until=2025-07-24T23:59" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

## 実装計画

### フェーズ1: Node.jsテストスクリプト
1. 基本的なAPI通信の実装
2. 日付範囲の指定機能
3. レスポンスのパースとMarkdown形式への変換

### フェーズ2: Obsidianプラグイン化
1. プラグインの基本構造作成
2. 日付選択UI
3. 設定画面（APIトークン、出力形式）
4. エディタへの挿入機能

## 技術スタック
- Node.js（テストスクリプト）
- TypeScript（Obsidianプラグイン）
- Obsidian Plugin API

## 参考資料
- [Todoist Sync API Documentation](https://developer.todoist.com/sync/v9/)
- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)

## 実装詳細

### テストスクリプト (test-todoist.js)
作成日: 2025-07-25

#### 機能
1. **日付指定**
   - コマンドライン引数で日付を指定可能
   - デフォルトは当日
   - 例: `node test-todoist.js 2025-07-24`

2. **出力オプション**
   - プロジェクト名の表示
   - 完了時刻の表示
   - カスタマイズ可能な出力形式

3. **エラーハンドリング**
   - APIトークンの検証
   - API応答エラーの適切な処理

#### 使用方法
```bash
# .envファイルにAPIトークンを設定
cp .env.example .env
# TODOIST_API_TOKENを編集

# 今日の完了タスクを取得
node test-todoist.js

# 特定の日付の完了タスクを取得
node test-todoist.js 2025-07-24
```

### Obsidianプラグイン実装
作成日: 2025-07-25

#### ファイル構成
- `main.ts` - プラグインのメインロジック
- `manifest.json` - プラグインメタデータ
- `styles.css` - カスタムスタイル
- `tsconfig.json` - TypeScript設定

#### 実装機能
1. **コマンド**
   - 「Insert completed tasks」コマンドを追加
   - コマンドパレットから実行可能

2. **日付選択モーダル**
   - 日付入力フィールド
   - 「Today」「Yesterday」ボタンで簡単選択
   - 前回選択した日付を記憶

3. **設定画面**
   - APIトークンの入力
   - プロジェクト名表示のON/OFF
   - 完了時刻表示のON/OFF
   - 見出しレベルの調整（1-6）

4. **API通信**
   - Fetch APIを使用（Obsidian環境で動作）
   - エラーハンドリング
   - 通知による状態表示

#### インストール方法
1. Obsidianのvaultの`.obsidian/plugins/`フォルダに`todoist-logger`フォルダを作成
2. `main.js`、`manifest.json`、`styles.css`をコピー
3. Obsidianを再起動し、設定→コミュニティプラグインでプラグインを有効化
4. プラグイン設定でAPIトークンを入力

#### 使用方法
1. コマンドパレット（Cmd/Ctrl + P）を開く
2. 「Todoist: Insert completed tasks」を検索・実行
3. 日付を選択
4. カーソル位置に完了タスクが挿入される