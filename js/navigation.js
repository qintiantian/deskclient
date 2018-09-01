const V = require('./js/vue')

V.component('nav-left',{
    template:
        `
             <div class="left">
                <ul>
                    <li>
                       <a>
                            <img id="profile" v-bind:src="vm.user.imgUrl">
                        </a>
                    </li>
                    <li>
                        <a href="index.html">
                            <img src="imgs/p1.png">
                        </a>
                    </li>
                    <li>
                        <a href="relationship.html">
                            <img src="imgs/p2.png">
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
})

