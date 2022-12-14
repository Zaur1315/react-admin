import '../../helpers/iframeLoader';

import axios from 'axios';
import React, {Component} from 'react';
import DOMHelper from '../../helpers/dom-helper';
import EditorText from '../editor-text/';
import UIkit from 'uikit'
import Spinner from '../spinner/spinner';



export default class Editor extends Component {
    constructor(){
        super();
        this.currentPage = 'index.html'
        this.state = {
            pageList: [],
            newPageName: '',
            loading: true
        }
        this.createNewPage = this.createNewPage.bind(this);
        this.isLoading = this.isLoading.bind(this);
        this.isLoaded = this.isLoaded.bind(this);
    }


    componentDidMount(){
        this.init(this.currentPage)
    }


    init(page) {
        this.iframe = document.querySelector('iframe');
        this.open(page, this.isLoaded);
        this.loadPageList();
    }


    open(page, cb){
        this.currentPage = page;
        axios
            .get(`../${page}?rnd=${Math.random()}`)
            .then(res => DOMHelper.parseStrToDOM(res.data))
            .then(DOMHelper.wrapTextNodes)
            .then(dom => {
                this.virtualDom = dom;
                return dom
            })
            .then(DOMHelper.serializeDOMtoString)
            .then(html => axios.post('./api/saveTempPage.php', {html}))
            .then(()=> this.iframe.load('../temp.html'))
            .then(()=> this.enableEditing())   
            .then(()=>this.injectStyles())  
            .then(cb)
    }


    save(onSuccess, onError){
        this.isLoading();
        const newDom = this.virtualDom.cloneNode(this.virtualDom);
        DOMHelper.unwrapTextNodes(newDom);
        const html = DOMHelper.serializeDOMtoString(newDom);
        axios
            .post('./api/savePage.php', {pageName: this.currentPage, html})
            .then(onSuccess)
            .catch(onError)
            .finally(this.isLoaded)

    }


    enableEditing() {
        this.iframe.contentDocument.body.querySelectorAll('text-editor').forEach(element => {
            const id = element.getAttribute('nodeid');
            const virtualElement =  this.virtualDom.body.querySelector(`[nodeid="${id}"]`);

            new EditorText(element, virtualElement)
        })
    }


    injectStyles(){
        const style = this.iframe.contentDocument.createElement('style');
        style.innerHTML=`

        h1,h2,h3,h4,h5,h6{
            overflow-y: inherit !important;
        }

        text-editor:hover {
            outline: 3px solid orange;
            outline-offset: 8px;
        }

        text-editor:focus {
            outline: 3px solid red;
            outline-offset: 8px;
        }
        `;
        this.iframe.contentDocument.head.appendChild(style);
    }





    loadPageList() {
        axios
            .get('./api')
            .then(res=> this.setState({pageList: res.data}))
    }


    createNewPage(){
        axios
            .post('./api/createNewPage.php',{'name': this.state.newPageName})
            .then(this.loadPageList())
            .catch(()=> alert(' ???????????????? ?????? ????????????????????! '))
    }


    deletePage(page){
        axios
            .post('./api/deletePage.php', {'name': page})
            .then(this.loadPageList())
            .catch(()=> alert(' ???????????????? ?????? ????????????????????! '))
    }

    isLoading() {
        this.setState({
            loading: true
        })
    }

    isLoaded() {
        this.setState({
            loading:false
        })
    }

    alerF(){
        if (confirm('???? ???????????? ???????????? ?????????????????? ???????????????????') == true){
            this.save(()=>{
                alert('?????????????? ??????????????????!')
            }, 
            ()=>{
                alert('?????? ???? ?????????? ???? ??????! ???????????????????? ?????? ??????.')
            });
            
        }
    }


    render(){
        const modal = true;
        const {loading} = this.state;
        let spinner;

        loading ? spinner = <Spinner active/> : spinner = <Spinner/>

        return(
            <>
            <iframe src={this.currentPage} frameBorder="0"></iframe>
            {spinner}
            <div className="panel">
                <button 
                            className="uk-button uk-button-primary" 
                            type="button" 
                            onClick={()=>this.alerF()}
                            >????????????????????????</button>
                {/* <button 
                            className="uk-button uk-button-primary" 
                            type="button" 
                            // onClick={()}
                            >????????????????????????</button> */}
            </div>
            </>
        )
    }
}