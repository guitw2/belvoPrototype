// ==UserScript==
// @name         Belvo prototype
// @namespace    BelvoProt
// @version      0.1
// @description  Prototype developed for Belvo's test
// @match        *://*/*
// @run-at       document-start
// @grant        GM_addStyle 
// @grant        GM_xmlhttpRequest
// @connect      sandbox.belvo.com
// ==/UserScript==

var baseCSS = `
    #belvoModal{
        position: fixed;
        background-color: #fafafa;
        border-color: #eee;
        opacity: 1; 
        top: 5px;
        right: 5px;
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 10px;
        box-shadow: 0px 0px 10px 0px rgba(0,0,0,.1);
        text-align: center;
        z-index: 5001;
        max-height: 95%;
        max-width: 95%;
        overflow: visible;
    }
    #belvoBody{
        display: none;
        position: relative;
        top: -25px;
        max-width: 800px;
        text-align: left;
        padding: 5px;
        margin-right: 10px;
    }
    #belvoTitle{
        font-size: 25px;
        position: relative;
        right: 10px;
        margin: 10px;
        font-weight: bold;
    }
    #belvoFooter{
        font-size: 0.75em;
        position: relative;
        margin-bottom: -25px;
        margim-top: 10px;
    }
    #belvoSubTitle{
        font-size: 0.75em;
    }
    a{
        cursor:pointer;
    }
    .belvoModalContainer{
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 5px;
        margin: 5px 0 0 0;
    }
    .belvoButton{
        background: #eee;
        color: inherit;
        border: 1px solid #ccc;
        border-radius: 3px;
        margin: 5px;
        padding: 2px;
    }
    .belvoButton:active{
        background: #fff;
    }
    .belvoInfoTable{
        border: 1px solid grey;
        border-radius: 3px;
        width: 100%;
        margin: 10px 0;
    }
    .belvoTransactionsList{
        margin: 0 15px 0;
        overflow: overlay;
        max-height: 100px;
    }
    .belvoTransactionDetails{
        margin-bottom: 10px;
    }
`;

GM_addStyle(baseCSS);

var baseHTML = `
    <div style="text-align:right">
        <b><a id="openBelvoButton"><</a></b>
    </div>
    <div id="belvoBody">
        <b id=belvoTitle>Belvo App Prototype</b><br/>
        <div class="belvoModalContainer" id="container1">
            <p>Insert your credentials below and open the widget to login</p>
            <span>Secret Id: </span><input id = "belvoSecretId" type="text" style="width:300px;"/>
            <br/>
            <span>Password: </span><input id = "belvoPassword" type="text" style="width:295px;"/>
            <div id="belvo"></div>
            <button class="belvoButton" id="openWidget">Open Widget</button>
        </div>
        <div class="belvoModalContainer" id="container2" style="display: none">
            <p id="bankToolsTitle"></p>
            <button class="belvoButton" id="retrieveAccounts">Retrieve Accounts</button>
            <div id="accountsTableContainer"></div>
        </div>
        <center><div id="belvoFooter"><p>Developed by Guilherme Tworkowski | v 0.1</div></center>
    </div>
`;

window.onload = async function() {
    var link;
    var institution;
    var id;
    var password;
    var token;
    const widget = document.createElement('script');
    widget.setAttribute('src', 'https://cdn.belvo.io/belvo-widget-1-stable.js');
    document.body.appendChild(widget);
    var belvoModal = document.createElement("div");
    belvoModal.id = "belvoModal";
    belvoModal.innerHTML = baseHTML;
    document.body.appendChild(belvoModal);

    document.getElementById("openWidget").onclick = async function() {
        id = document.getElementById("belvoSecretId").value;
        password = document.getElementById("belvoPassword").value;
        token = btoa(`${id}:${password}`);
        if (!id || !password) {
            window.alert("Both Id and Password are required to open the widget. Please try again.");
            return;
        }
        var widgetPayload = {
            "id": id,
            "password": password,
            "scopes": "read_institutions,write_links,read_links"
        }

        var widgetResponse = await fetch("https://sandbox.belvo.com/api/token/", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Host': 'sandbox.belvo.com'
            },
            body: JSON.stringify(widgetPayload)
        });
        if (widgetResponse.status >= 400) {
            var widgetJson = await widgetResponse.json();
            console.error(JSON.stringify(widgetJson));
            window.alert(`Some error ocurred to generate the token: ${widgetJson[0].message} \nPlease check the console for more details.`);
            return;
        }

        var widgetJson = await widgetResponse.json();
        var widgetAccess = widgetJson.access;
        var widgetRefresh = widgetJson.refresh;

        function expandBankTools(institution) {
            document.getElementById("bankToolsTitle").innerText = institution;
            document.getElementById("container2").style.display = "block";
        }

        function successCallbackFunction() {
            expandBankTools(arguments[1]);
            link = arguments[0];
            institution = arguments[1];
            console.log("Widget connection successfull: ");
            for (let argument of arguments) {
                console.log(argument);
            }
        }

        belvoSDK.createWidget(widgetAccess, {
            locale: 'en',
            callback: (link, institution) => successCallbackFunction(link, institution),
        }).build();
    }
    document.getElementById("retrieveAccounts").onclick = async function() {
        let options = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Basic ${token}`
            },
            body: JSON.stringify({ save_data: false, link: link })
        };

        var accountsResponse = await fetch('https://sandbox.belvo.com/api/accounts/', options);
        if (accountsResponse.status >= 400) {
            var accountsJson = await accountsResponse.json();
            console.error(JSON.stringify(accountsJson));
            window.alert(`Some error ocurred to get the accounts: ${accountsJson[0].message} \nPlease check the console for more details.`);
            return;
        }
        var accountsJson = await accountsResponse.json();
        for (let account of accountsJson) {
            var div = document.createElement("div");
            div.classList.add("belvoInfoTable");
            var table = document.createElement("table");
            var trName = document.createElement("tr");
            var nameHead = document.createElement("td");
            var nameValue = document.createElement("td");
            nameHead.innerHTML = `<b>Name</b>`;
            nameValue.innerText = account.name;
            var trNumber = document.createElement("tr");
            var numberHead = document.createElement("td");
            var numberValue = document.createElement("td");
            numberHead.innerHTML = `<b>Number</b>`;
            numberValue.innerText = account.number;
            var trBalance = document.createElement("tr");
            var balanceHead = document.createElement("td");
            var balanceValue = document.createElement("td");
            balanceHead.innerHTML = `<b>Balance</b>`;
            balanceValue.innerText = `${account.currency} ${account.balance.current}`;
            table.appendChild(trName);
            table.appendChild(trNumber);
            table.appendChild(trBalance);
            trName.appendChild(nameHead);
            trName.appendChild(nameValue);
            trNumber.appendChild(numberHead);
            trNumber.appendChild(numberValue);
            trBalance.appendChild(balanceHead);
            trBalance.appendChild(balanceValue);
            div.appendChild(table);
            var transactionsButton = document.createElement("button");
            transactionsButton.innerText = "Check transactions for this account";
            transactionsButton.classList.add("belvoButton");
            transactionsButton.onclick = async function() {
                let today = new Date();
                let lastMonth = new Date(new Date().setDate(today.getDate() - 30));
                
                let trannsactionsOptions = {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${token}`
                    },
                    body: JSON.stringify({
                        save_data: true,
                        link: link,
                        date_from: lastMonth.toISOString().split('T')[0],
                        date_to: today.toISOString().split('T')[0],
                        account: account.id
                    })
                };
                var transactionsResponse = await fetch('https://sandbox.belvo.com/api/transactions/', trannsactionsOptions);
                if (transactionsResponse.status >= 400) {
                    var transactionsJson = await transactionsResponse.json();
                    console.error(JSON.stringify(transactionsJson));
                    window.alert(`Some error ocurred to get the transaction: ${transactionsJson[0].message} \nPlease check the console for more details.`);
                    return;
                }
                var transactionsList = document.createElement("UL");
                transactionsList.classList.add("belvoTransactionsList");
                div.appendChild(transactionsList);
                var transactionsJson = await transactionsResponse.json();
                for (let transaction of transactionsJson) {
                    var transactionDetails = document.createElement("LI");
                    transactionDetails.classList.add("belvoTransactionDetails")
                    transactionDetails.innerHTML=`<b>Type</b>:${transaction.type}<br/><b>Status</b>:${transaction.status}<br/><b>Amount</b>:${transaction.currency} ${transaction.amount}<br/><b>Collected at</b>:${transaction.collected_at}<br/>`;
                    console.log(transactionDetails.innerHTML);
                    transactionsList.appendChild(transactionDetails);
                }
            }
            div.appendChild(transactionsButton);
            document.getElementById("accountsTableContainer").appendChild(div);
        }
    }


    belvoButton = document.getElementById("openBelvoButton");
    belvoBody = document.getElementById("belvoBody");
    belvoButton.onclick = function() { // button to open and close the modal
        toggleBelvoModal();
    }
    var buttonStatus = true;

    function toggleBelvoModal() {
        var catButton = document.getElementById("openBelvoButton");
        var catBody = document.getElementById("belvoBody");
        if (buttonStatus) {
            catBody.style.display = "block";
            buttonStatus = !buttonStatus;
            catButton.innerHTML = ">";
        } else {
            catBody.style.display = "none";
            buttonStatus = !buttonStatus;
            catButton.innerHTML = "<";
        }
    }
}
