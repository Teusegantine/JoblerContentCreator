# Política de Privacidade - Jobler Content Creator

Esta Política de Privacidade explica como a extensão **Jobler Content Creator** lida com as informações e dados dos usuários.

---

### 1. Coleta de Informações
* **Conteúdo da Aba Ativa (Conteúdo do Site)**: A extensão lê temporariamente o texto e o título do artigo aberto no seu navegador apenas quando o usuário solicita a geração de conteúdo. Esse texto é utilizado exclusivamente para alimentar o prompt que resume a matéria.
* **Chaves de API**: As chaves de API informadas pelo usuário nas configurações (Google Gemini, OpenAI, DeepSeek) são armazenadas localmente no navegador por meio da API `chrome.storage.local` e nunca são transmitidas a servidores de terceiros gerenciados por nós.
* **Dados de Login e Histórico**: Caso o usuário realize a autenticação com o Supabase, os posts gerados e históricos de uso são sincronizados diretamente com a infraestrutura do Supabase de propriedade do próprio usuário ou da empresa, sem intermediações.

---

### 2. Uso dos Dados
* Os dados de texto coletados são processados para gerar resumos, postagens para redes sociais (LinkedIn/Instagram) e estruturas de carrossel.
* A extensão realiza chamadas seguras diretamente para os servidores das APIs de IA oficiais (Google, OpenAI e DeepSeek) para processar o prompt.

---

### 3. Compartilhamento e Transferência de Dados
* **Não vendemos, alugamos ou compartilhamos** qualquer dado do usuário ou conteúdo coletado com empresas terceiras ou agências de publicidade.
* As informações transitam diretamente entre o navegador do usuário e as APIs oficiais configuradas pelo próprio usuário.

---

### 4. Armazenamento e Exclusão
* Todas as configurações e históricos gerados localmente podem ser excluídos pelo usuário a qualquer momento limpando os dados da extensão ou desinstalando o aplicativo.
