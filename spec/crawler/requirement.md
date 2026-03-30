## 需求

我需要一个定时任务，爬取指定网页的数据。我需要先获取列表html页面，然后获取详细的page地址，从page中爬取通知信息。

脚本要支持定时触发也要支持手动触发。

我需要爬取两个list页面：
1. https://jwc.hdu.edu.cn/xkjs/list.htm，这个列表中的事件类型是学科竞赛，type_id为type_contest
2. https://jwc.hdu.edu.cn/ksgl/list.htm，这个列表中的事件类型是考试管理，type_id为type_exam_mgmt


## html示例说明

### 列表页面

list页面参考 @spec/crawler/list.html
以下是列表中实际需要的数据信息部分，先根标题和时间查一下数据库中是否已经有这个事件了，若没有就访问page页面爬取数据。
```
<div class="jzlb clearfix">
          <div class="btt3"><a href="/2026/0313/c13475a290241/page.htm" target="_blank">2025-2026 学年第二学期开学补考考场通报</a></div>
          <div class="fbsj4">2026-03-13</div>
        </div>
        
        <div class="jzlb clearfix">
          <div class="btt3"><a href="/2026/0313/c13475a290234/page.htm" target="_blank">关于2026年上半年全国大学外语四六级考试报名的通知</a></div>
          <div class="fbsj4">2026-03-13</div>
        </div>
        
        <div class="jzlb clearfix">
          <div class="btt3"><a href="/2026/0313/c13475a290233/page.htm" target="_blank">关于2026年上半年浙江省高校计算机等级考试报名工作的通知</a></div>
          <div class="fbsj4">2026-03-13</div>
        </div>
```

### 详情页面

page页面参考 @spec/crawler/page.html

以下是page中实际正文部分示例。

```
<div class="wrapper" id="d-container">
  <div class="inner clearfix">
    <div class="infobox wow fadeInUp">
      <div class="article" frag="窗口3" portletmode="simpleArticleAttri">
        
          <h1 class="arti_title">关于举办第十二届全国大学生能源经济学术创意大赛校选拔赛决赛的通知</h1>
          <h2 class="arti_title"></h2>
          <p class="arti_metas"><span class="arti_publisher">发布者：颜曰越</span><span class="arti_update">发布时间：2026-03-26</span><span class="arti_views">浏览次数：<span class="WP_VisitCount" url="/_visitcountdisplay?siteId=180&type=3&articleId=290690">10</span></span></p>
          <div class="entry">
            <div class="read"><div class='wp_articlecontent'><p class="MsoNormal" style="line-height:37px;mso-line-height-rule:exactly"><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">各学院：</span></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">第十二届全国大学生能源经济学术创意大赛校选拔赛初赛已于近期结束。选拔赛得到了校内广大师生的积极参与，目前已有<span lang="EN-US">74</span>支队伍完成报名和作品提交，其中有效作品<span lang="EN-US">73</span>个，<span lang="EN-US">37</span>支队伍进入到校决赛现场答辩环节（具体名单见附件）。现将决赛有关事项通知如下：</span></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><strong><span style="font-size:19px;font-family:黑体;color:#333333;font-weight:normal;">一、决赛安排</span></strong><strong style="mso-bidi-font-weight:normal"></strong></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">决赛时间：<span lang="EN-US">2026</span>年<span lang="EN-US">3</span>月<span lang="EN-US">28</span>日<span lang="EN-US">8:30-13:00</span>。</span></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">决赛地点：杭州电子科技大学第<span lang="EN-US">7</span>教研楼北<span lang="EN-US">106</span>、第<span lang="EN-US">7</span>教研楼北<span lang="EN-US">206</span>。</span></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">决赛形式：决赛按抽签形式进行，每支团队参赛时间约为<span lang="EN-US">12</span>分钟（陈述环节<span lang="EN-US">+</span>答辩环节），请参赛团队提前将<span lang="EN-US">PPT</span>以“作品编号<span lang="EN-US">+</span>作品标题”命名，开赛前拷贝至决赛地点并进行调试。</span></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><strong><span style="font-size:19px;font-family:黑体;color:#333333;font-weight:normal;">二、决赛注意事项</span></strong><strong></strong></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">请各参赛团队严格控制陈述时间，陈述简洁，陈述内容应包括作品的核心思想、技术路径、发展前景以及创新点等；回答问题要准确、重点突出，言简意赅。</span></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">决赛结束后，校能源经济学术创意大赛竞赛组委会将根据评审和现场答辩专家评分确定获奖结果。本届竞赛将评出一等奖<span lang="EN-US">7</span>队、二等奖<span lang="EN-US">11</span>队、三等奖<span lang="EN-US">19</span>队，根据竞赛最终排名，择优录取参加省赛。</span></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><strong><span style="font-size:19px;font-family:黑体;color:#333333;font-weight:normal;">三、联系方式</span></strong><strong></strong></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><span lang="EN-US" style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">1.</span><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">竞赛联系人：经济学院高老师，电话<span lang="EN-US">18768402456</span>。</span></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><span lang="EN-US" style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">2.</span><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">全国大学生能源经济学术创意大赛官方网站：<span lang="EN-US">http://energy.qibebt.ac.cn/eneco/contribution/index.html#/index</span>。</span></p><p class="MsoNormal" style="text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly"><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;"></span><img src="/_ueditor/themes/default/images/icon_doc.gif" isupload="true" /><a href="/_upload/article/files/48/b8/3bfbad1048ef97d00e99bf70b80e/d0d55ee9-b463-4545-9166-0cee4f335cb3.docx" sudyfile-attr="{'title':'附件：第十二届全国大学生能源经济学术创意大赛校选拔赛决赛名单.docx'}" style="font-size:18px;text-decoration:underline;"><span style="font-size:18px;font-family:仿宋_gb2312, fangsong_gb2312;">附件：第十二届全国大学生能源经济学术创意大赛校选拔赛决赛名单.docx</span></a><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;"></span></p><p class="MsoNormal" style="text-align:right;text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly;text-align:right;"><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">教务处、经济学院</span></p><p style="text-align:right;text-indent:37px;mso-char-indent-count:2.0;line-height:37px;mso-line-height-rule:exactly;text-align:right;"><span lang="EN-US" style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">2026</span><span style="font-size:19px;font-family:仿宋_gb2312;color:#333333;">年<span lang="EN-US">3</span>月<span lang="EN-US">26</span>日</span></p><p><br /></p></div></div>
          </div>
        
      </div>
    </div>
  </div>
</div>
```