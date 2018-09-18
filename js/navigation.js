const V = require('./js/vue')
V.component('nav-left',{
    props:['user','isfloat'],
    data: function () {
        return {
            imgUrl1: "imgs/p1.png",
            imgUrl2: "imgs/p2-1.png"
        }
    },
    template:
            `
             <div class="left drag" id="nav-left">
                <ul class="non-drag">
                    <li>
                       <a @click="showUserDtl(isfloat)">
                            <img id="profile" v-bind:src="user.imgUrl">
                        </a>
                    </li>
                    <li>
                        <a @click="router(true, false)">
                            <img v-bind:src="imgUrl1">
                        </a>
                    </li>
                    <li>
                        <a @click="router(false, true)">
                            <img v-bind:src="imgUrl2">
                        </a>
                    </li>
                    <li>
                        <a>
                            <img src="imgs/p3.png">
                        </a>
                    </li>
                    <li>
                        <a>
                            <img id="settings" src="imgs/p4.png">
                        </a>
                    </li>
                </ul>
            </div>
                `
    ,
    methods:{
        router: function(s1, s2){
            if(s1){
                this.imgUrl1 = "imgs/p1.png"
                this.imgUrl2 = "imgs/p2-1.png";
            }
            if(s2){
                this.imgUrl1 = "imgs/p1-1.png";
                this.imgUrl2 = "imgs/p2.png"
            }
            let data = {
                isShow : s1,
                isShow2: s2
            }
            this.$emit('change-show', data)
        },
        showUserDtl: function(data){
            this.$emit('show-user', !data)
        }
    }
})

new V({
    el:"#nav-left"
})


