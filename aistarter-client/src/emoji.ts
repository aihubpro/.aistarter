// 获取 emoji 图片路径的辅助函数
const getEmojiPath = (path: string) => {
  return `./emoji/${path}`
}

let emoji = {
  faceList: [{ type: 'img', label: getEmojiPath('smile.webp') }, { type: 'img', label: getEmojiPath('tv/doge.webp') }],
  emojiList: [
    [
      { type: 'img', label: '[口罩]', value: getEmojiPath('kouzhao.webp') },
      { type: 'img', label: '[狗头]', value: getEmojiPath('goutou.webp') },
      { type: 'img', label: '[微笑]', value: getEmojiPath('smile.webp') },
      { type: 'img', label: '[大笑2]', value: getEmojiPath('daxiao2.png') },
      { type: 'img', label: '[OK]', value: getEmojiPath('ok.webp') },
      { type: 'img', label: '[星星眼]', value: getEmojiPath('star.webp') },
      { type: 'img', label: '[辣眼睛]', value: getEmojiPath('layanjing.webp') },
      { type: 'img', label: '[吃瓜]', value: getEmojiPath('huaji.webp') },
      { type: 'img', label: '[滑稽]', value: getEmojiPath('chigua.webp') },
      { type: 'img', label: '[呲牙]', value: getEmojiPath('teeth.webp') },
      { type: 'img', label: '[打call]', value: getEmojiPath('dacall.webp') },
      { type: 'img', label: '[喝酒]', value: getEmojiPath('hejiu.webp') },
      { type: 'img', label: '[乖]', value: getEmojiPath('guai.webp') },
      { type: 'img', label: '[吐舌]', value: getEmojiPath('tushe.webp') },
      { type: 'img', label: '[汗]', value: getEmojiPath('han.webp') },
      { type: 'img', label: '[大哭2]', value: getEmojiPath('daku.webp') },
      { type: 'img', label: '[超赞]', value: getEmojiPath('chaozan.webp') },
      { type: 'img', label: '[超开心]', value: getEmojiPath('chaokaixin.webp') },
      { type: 'img', label: '[委屈]', value: getEmojiPath('weiqu.webp') },
      { type: 'img', label: '[困狗]', value: getEmojiPath('kungou.webp') },
      { type: 'img', label: '[藏狐]', value: getEmojiPath('zanghu.webp') },
      { type: 'img', label: '[脸红]', value: getEmojiPath('lianhong.webp') },
      { type: 'img', label: '[脱单doge]', value: getEmojiPath('doge.webp') },
      { type: 'img', label: '[给心心]', value: getEmojiPath('heart.webp') },
      { type: 'img', label: '[笑]', value: getEmojiPath('dx.webp') },
      { type: 'img', label: '[哦呼]', value: getEmojiPath('oh.webp') },
      { type: 'img', label: '[嫌弃]', value: getEmojiPath('xq.webp') },
      { type: 'img', label: '[喜欢]', value: getEmojiPath('like.webp') },
      { type: 'img', label: '[酸了]', value: getEmojiPath('sl.webp') },
      { type: 'img', label: '[大哭]', value: getEmojiPath('dq.webp') },
      { type: 'img', label: '[害羞]', value: getEmojiPath('hx.webp') },
      { type: 'img', label: '[无语]', value: getEmojiPath('wy.webp') },
      { type: 'img', label: '[疑惑]', value: getEmojiPath('yh.webp') },
      { type: 'img', label: '[调皮]', value: getEmojiPath('tiaopi.webp') },
      { type: 'img', label: '[笑哭]', value: getEmojiPath('xiaoku.webp') },
      { type: 'img', label: '[奸笑]', value: getEmojiPath('jianxiao.webp') },
      { type: 'img', label: '[偷笑]', value: getEmojiPath('touxiao.webp') },
      { type: 'img', label: '[阴险]', value: getEmojiPath('yinxian.webp') },
      { type: 'img', label: '[捂脸]', value: getEmojiPath('wulian.webp') },
      { type: 'img', label: '[无语]', value: getEmojiPath('wy.webp') },
      { type: 'img', label: '[妙啊]', value: getEmojiPath('miaoa.webp') },
      { type: 'img', label: '[鼓掌]', value: getEmojiPath('guzhang.webp') },
      { type: 'img', label: '[尴尬]', value: getEmojiPath('ganga.webp') },
      { type: 'img', label: '[冷]', value: getEmojiPath('cold.webp') },
      { type: 'img', label: '[灵魂出窍]', value: getEmojiPath('linghunchuqiao.webp') },
      { type: 'img', label: '[傲娇]', value: getEmojiPath('aojiao.webp') },
      { type: 'img', label: '[疼]', value: getEmojiPath('teng.webp') },
      { type: 'img', label: '[吓]', value: getEmojiPath('xia.webp') },
      { type: 'img', label: '[生病]', value: getEmojiPath('shengbing.webp') },
      { type: 'img', label: '[吐]', value: getEmojiPath('tu.webp') },
      { type: 'img', label: '[嘘声]', value: getEmojiPath('xusheng.webp') },
      { type: 'img', label: '[捂眼]', value: getEmojiPath('wuyan.webp') },
      { type: 'img', label: '[思考]', value: getEmojiPath('sikao.webp') },
      { type: 'img', label: '[再见]', value: getEmojiPath('zaijian.webp') },
      { type: 'img', label: '[翻白眼]', value: getEmojiPath('fanbaiyan.webp') },
      { type: 'img', label: '[哈欠]', value: getEmojiPath('haqian.webp') },
      { type: 'img', label: '[奋斗]', value: getEmojiPath('fengdou.webp') },
      { type: 'img', label: '[墨镜]', value: getEmojiPath('mojing.webp') },
      { type: 'img', label: '[撇嘴]', value: getEmojiPath('piezui.webp') },
      { type: 'img', label: '[难过]', value: getEmojiPath('nanguo.webp') },
      { type: 'img', label: '[抓狂]', value: getEmojiPath('zhuakuang.webp') },
      { type: 'img', label: '[生气]', value: getEmojiPath('shengqi.webp') },
      { type: 'img', label: '[爱心]', value: getEmojiPath('aixin.webp') },
      { type: 'img', label: '[胜利]', value: getEmojiPath('shengli.webp') },
      { type: 'img', label: '[抱拳]', value: getEmojiPath('baoquan.webp') },
      { type: 'img', label: '[保佑]', value: getEmojiPath('baoyou.webp') },
      { type: 'img', label: '[支持]', value: getEmojiPath('zhichi.webp') },
    ],
    [
      { type: 'img', label: '[tv_doge]', value: getEmojiPath('tv/doge.webp') },
      { type: 'img', label: '[tv_坏笑]', value: getEmojiPath('tv/huaixiao.webp') },
      { type: 'img', label: '[tv_难过]', value: getEmojiPath('tv/nanguo.webp') },
      { type: 'img', label: '[tv_生气]', value: getEmojiPath('tv/shengqi.webp') },
      { type: 'img', label: '[tv_委屈]', value: getEmojiPath('tv/weiqu.webp') },
      { type: 'img', label: '[tv_斜眼笑]', value: getEmojiPath('tv/xieyanxiao.webp') },
      { type: 'img', label: '[tv_呆]', value: getEmojiPath('tv/dai.webp') },
      { type: 'img', label: '[tv_发怒]', value: getEmojiPath('tv/fanu.webp') },
      { type: 'img', label: '[tv_惊吓]', value: getEmojiPath('tv/jingxia.webp') },
      { type: 'img', label: '[tv_呕吐]', value: getEmojiPath('tv/outu.webp') },
      { type: 'img', label: '[tv_思考]', value: getEmojiPath('tv/sikao.webp') },
      { type: 'img', label: '[tv_微笑]', value: getEmojiPath('tv/weixiao.webp') },
      { type: 'img', label: '[tv_疑问]', value: getEmojiPath('tv/yiwen.webp') },
      { type: 'img', label: '[tv_大哭]', value: getEmojiPath('tv/daku.webp') },
      { type: 'img', label: '[tv_鼓掌]', value: getEmojiPath('tv/guzhang.webp') },
      { type: 'img', label: '[tv_抠鼻]', value: getEmojiPath('tv/koubi.webp') },
      { type: 'img', label: '[tv_亲亲]', value: getEmojiPath('tv/qinqin.webp') },
      { type: 'img', label: '[tv_调皮]', value: getEmojiPath('tv/tiaopi.webp') },
      { type: 'img', label: '[tv_笑哭]', value: getEmojiPath('tv/xiaoku.webp') },
      { type: 'img', label: '[tv_晕]', value: getEmojiPath('tv/yun.webp') },
      { type: 'img', label: '[tv_点赞]', value: getEmojiPath('tv/dianzan.webp') },
      { type: 'img', label: '[tv_害羞]', value: getEmojiPath('tv/haixiu.webp') },
      { type: 'img', label: '[tv_睡着]', value: getEmojiPath('tv/shuizhe.webp') },
      { type: 'img', label: '[tv_色]', value: getEmojiPath('tv/se.webp') },
      { type: 'img', label: '[tv_吐血]', value: getEmojiPath('tv/tuxue.webp') },
      { type: 'img', label: '[tv_无奈]', value: getEmojiPath('tv/wunai.webp') },
      { type: 'img', label: '[tv_再见]', value: getEmojiPath('tv/zaijian.webp') },
      { type: 'img', label: '[tv_流汗]', value: getEmojiPath('tv/liuhan.webp') },
      { type: 'img', label: '[tv_偷笑]', value: getEmojiPath('tv/touxiao.webp') },
      { type: 'img', label: '[tv_抓狂]', value: getEmojiPath('tv/zhuakuang.webp') },
      { type: 'img', label: '[tv_黑人问号]', value: getEmojiPath('tv/wenhao.webp') },
      { type: 'img', label: '[tv_困]', value: getEmojiPath('tv/kun.webp') },
      { type: 'img', label: '[tv_打脸]', value: getEmojiPath('tv/dalian.webp') },
      { type: 'img', label: '[tv_闭嘴]', value: getEmojiPath('tv/bizui.webp') },
      { type: 'img', label: '[tv_鄙视]', value: getEmojiPath('tv/bishi.webp') },
      { type: 'img', label: '[tv_腼腆]', value: getEmojiPath('tv/miantian.webp') },
      { type: 'img', label: '[tv_馋]', value: getEmojiPath('tv/chan.webp') },
      { type: 'img', label: '[tv_可爱]', value: getEmojiPath('tv/keai.webp') },
      { type: 'img', label: '[tv_发财]', value: getEmojiPath('tv/facai.webp') },
      { type: 'img', label: '[tv_生病]', value: getEmojiPath('tv/shengbing.webp') },
      { type: 'img', label: '[tv_流鼻血]', value: getEmojiPath('tv/liubixue.webp') },
      { type: 'img', label: '[tv_尴尬]', value: getEmojiPath('tv/ganga.webp') },
      { type: 'img', label: '[tv_大佬]', value: getEmojiPath('tv/dalao.webp') },
      { type: 'img', label: '[tv_流泪]', value: getEmojiPath('tv/liulei.webp') },
      { type: 'img', label: '[tv_冷漠]', value: getEmojiPath('tv/lenmo.webp') },
      { type: 'img', label: '[tv_皱眉]', value: getEmojiPath('tv/zhoumei.webp') },
      { type: 'img', label: '[tv_鬼脸]', value: getEmojiPath('tv/guilian.webp') },
      { type: 'img', label: '[tv_调侃]', value: getEmojiPath('tv/tiaokan.webp') },
      { type: 'img', label: '[tv_目瞪口呆]', value: getEmojiPath('tv/mudengkoudai.webp') }
    ]
  ],
  activeIndex: 1
}

if (emoji) {
  let obj = emoji.emojiList.reduce((acc, cur) => {
    // @ts-ignore
    let arr = cur.filter(e => e.type != 'emoji')
    arr.forEach(e => {
      // @ts-ignore
      acc[e.label] = e.value
    })
    return acc
  }, {})
  // @ts-ignore
  emoji.allEmoji = obj
}

export default {
  ...emoji
}