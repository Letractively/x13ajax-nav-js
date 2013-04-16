(
/*
*	@param object jQuery -	объект jQuery
*	@class x13AjaxNav
*/
function ($, fieldName)
{
	/**
	* x13AjaxNav.js - Класс аякс-навигации по сайту и автоматического биндинга событий
	*
	* @author					Marat K. (frostosx, klyde13, icecrust13)
	* @license					GNU GPL 3: http://www.gnu.org/licenses/gpl.html
	* @contacts					klyde13[]gmail.com
	*
	* {
	* 	Требует чтобы ajax-ответ с сервера являлся JSON-объектом со следующими полями:
	* 		~ controller 		- имя контроллера
	* 		~ method 			- имя метода
	* 		~ content 			- контент для страницы
	* 		~ [title] 			- опциональное поле, title для страницы
	* 		~ [destinationNode] - опциональное поле, определяющее целевой html-элемент
	* }
	*
	*
	** При первой загрузки страницы необходимо указать параметры URI, вызывав следующий метод 
	** init(base_url, controller, method)
	** @param string base_url	- корневой URL сайта, например "http://example.com/"
	** @param string controller	- текущий открытый контроллер, например "profile"
	** @param string method		- текущий открытый метод контроллера, например "view"
	*
	*
	* @constructor
	*/

	function x13AjaxNav()
	{
		this.params = {};
		this.global = (function () {return this;})(); //window
	}

	/**
	* Установка параметров. Этот метод необходимо вызвать при первой загрузки страницы
	*
	* @param string base_url	- корневой URL сайта, например "http://example.com/"
	* @param string controller	- текущий открытый контроллер, например "profile"
	* @param string method		- текущий открытый метод контроллера, например "view"
	*
	* @method init
	* @return null
	*/
	x13AjaxNav.prototype.init = function (base_url, controller, method)
	{
		this.params.base_url = base_url;
		this.params.controller = controller;
		this.params.method = method;

		this.params.loadedTime = this.now();

		$(this.global).bind('popstate', 
			$.proxy(
				function (e)
				{
					if ((this.now() - this.params.loadedTime) > 1) //if - костыль для [sctricted]контуженного[/sctricted] хрома
						this.processInternalLink(this.global.location);
				}, this)
		);

		$('html').on('click', $.proxy(this.linkClick, this));
		$(document).ready($.proxy(this.reloaded, this));
	}

	/**
	* Callback для визуализации загрузки страницы, будет вызываться перед отправкой ajax-запроса
	*
	* @method navEffect
	* @return null
	*/
	x13AjaxNav.prototype.navEffect = function () {};

	/**
	* Callback для скрытия эффекта визуализации загрузки страницы, будет вызывать после отправки ajax-запроса
	*
	* @method navDisEffect
	* @return null
	*/
	x13AjaxNav.prototype.navDisEffect = function () {};

	/**
	* Обработка пришедших ajax-данных
	* Если пришлел ответ с полем redirect, то запускает обработку урла redirect и прерывает обработку,
	* иначе устанавливает служебные переменные в объект конфигурации и запускает установку биндов на элементы страницы
	*
	* @method processAjaxResponse
	* @return null
	*/
	x13AjaxNav.prototype.processAjaxResponse = function (d)
	{
		if (d.redirect)
		{
			history.replaceState(null, null, link);
			return this.processInternalLink(d.redirect, true);				
		}

		this.params.controller = d.controller;
		this.params.method = d.method;

		if (d.title)
			$('title').html(d.title);

		if (d.content)
		{
			var destinationNode;

			if (d.destinationNode)
				destinationNode = d.destinationNode;
					else destinationNode = $('#showContentSpan') ? '#showContentSpan' : 'body';

			$(destinationNode).html(d.content);
		}

		if (typeof this.processAjaxResponseInterlayer == 'function')
			this.processAjaxResponseInterlayer(d);

		this.reloaded(999);

		this.lastOk = true;
	};

	/**
	**
	* Прослойка для метода обработки пришедших ajax-данных this.processAjaxResponse
	* @method processAjaxResponseInterlayer
	* @return null
	*/
	x13AjaxNav.prototype.processAjaxResponseInterlayer = function (d) {};

	/**
	* Метод обработки ошибки ajax-запроса
	*
	* @method isBaseURL
	* @return boolean результат проверки
	*/
	x13AjaxNav.prototype.processError = function (e)
	{
		alert('ошибка выполнения запроса');
	};

	/**
	* Метод проверки URL на предмет его принадлежности нашему сайту
	*
	* @method isBaseURL
	* @param string url - url для проверки
	* @return boolean результат проверки
	*/
	x13AjaxNav.prototype.isBaseURL = function (url)
	{
		return (url + "").toLowerCase().indexOf(this.params.base_url.toLowerCase()) === 0;
	};

	/**
	* Метод обработки URL
	*
	* @method isBaseURL
	* @param string link - url для обработки
	* @return boolean успешность обработки URL
	*/
	x13AjaxNav.prototype.processInternalLink = function (link)
	{
		if (!this.isBaseURL(link)) return false;

		this.lastOk = false;

		if (typeof this.navEffect == 'function')
			this.navEffect();

		$.ajax(
			{
				type: "GET",
				dataType: "JSON",
				url: link,
				async: false,
				success: $.proxy(this.processAjaxResponse, this),
				error: $.proxy(this.processError, this)
			}
		);

		if (typeof this.navDisEffect == 'function')
			this.navDisEffect();
		
		return this.lastOk;
	};

	/**
	* Метод-calback для обработки клика по ссылке
	* Для ajax-Обрабоки ссылка должна быть локальной, а так же ссылка или её первый родитель должны иметь класс ajaxNav
	*
	* @method linkClick
	* @param object e - объект события клика
	* @return boolean взвращает true, если сыылка не должна обрабатываться, fasle - если ссылка прошла обработку
	*/
	x13AjaxNav.prototype.linkClick = function (e)
	{
		var el = $(e.target);

		if (el.prop('tagName') === 'IMG'
			&& el.parent().prop('tagName') === 'A') el = $(el.parent());

		if (el.prop('tagName') !== "A") return true;
		
		var href = el.prop('href');
		if (!this.isBaseURL(href)) return true;

		if (!el.hasClass('ajaxNav') && !el.parent().hasClass('ajaxNav')) return true;
		
		if (this.processInternalLink(href))
			history.pushState(null, null, href);

		e.stopPropagation();
		return false;
			
	};

	/**
	* Метод установки обработчиков событий на странице после её загруки/перезагрузки
	*
	* @method reloaded
	* @return null
	*/
	x13AjaxNav.prototype.reloaded = function ()
	{
		var k, indBind;

		if (!this.rebinds) return true;

		var controller = $.trim(this.params.controller.toLowerCase());
		var method = $.trim(this.params.method.toLowerCase());

		if (this.rebinds['*'])
			for (k in this.rebinds['*'])
				if (typeof this.rebinds['*'][k] == 'function')
					this.rebinds['*'][k].apply(this.global, []);

		var routes = 
			{
				c:	controller, 
				m:	method,
				cm:	controller + '/' + method
			};

		for (var type in routes)
		{
			var route = routes[type];
			var destArray = this.rebinds[type][route];

			if (!destArray) continue;

			for (k in destArray) 
			{
				if (typeof destArray[k] == 'function')
					destArray[k].apply(this.global, []);
			}
		}
	};

	/**
	* Метод установки функции, которая должна вызываться в зависимости от обработанного uri (controller, method)
	*
	* @param string dest - целевой uri для вызова функции
	* испозуйте "*"" чтобы функция вызывалась после каждой обработки на любоГо uri
	* испозуйте "/myMethod" чтобы функция вызывалась после обработки метода myMethod в любом из контроллеров
	* испозуйте "myController/" чтобы функция вызывалась после каждой обработки на любой странице контроллера myController
	* испозуйте "myController/myMethod" чтобы функция вызывалась после каждой обработки метода myMethod в контролллере myController
	*
	* @param function callBack - функция, которая будет вызываться в зависимости от обрабатываемого uri
	*
	* @method $
	* @return booelan взвращает успешность усановки коллбека
	*/
	x13AjaxNav.prototype.addRoute = function (dest, callBack)
	{
		if (typeof callBack !== 'function') return false;
		
		if (!this.rebinds)		this.rebinds = {};
		if (!this.rebinds['*'])	this.rebinds['*'] = [];
		if (!this.rebinds['m'])	this.rebinds['m'] = {};
		if (!this.rebinds['c'])	this.rebinds['c'] = {};
		if (!this.rebinds['cm'])	this.rebinds['cm'] = {};

		if (!dest || dest == '*')
		{
			this.rebinds['*'].push(callBack);
			return true;
		}

		dest = dest.split('/');
		var ind = false, destArray = false;


		if (dest[1] && (!dest[0] || dest[0] == '*'))
		{
			destArray = 'm';
			ind = dest[1];
		}

		if (dest[0] && (!dest[1] || dest[1] == '*'))
		{
			destArray = 'c';
			ind = dest[0];
		}

		if (dest[0] && dest[1] && (dest[0] != '*') && (dest[1] != '*'))
		{
			destArray = 'cm';
			ind = dest[0] + '/' + dest[1];
		}

		if (ind && destArray)
		{
			if (!this.rebinds[destArray][ind])
				this.rebinds[destArray][ind] = [];

			this.rebinds[destArray][ind].push(callBack);

			return true;
		}

		return false;
	};
		
	/**
	* Метод возвращающий текукищий unixtime
	*
	* @method now
	* @return integer unixtime
	*/
	x13AjaxNav.prototype.now = function ()
	{
		return Math.round((new Date()).getTime() / 1000);
	};

	$[fieldName] = new x13AjaxNav();

})(jQuery, 'x13');


/**
* Примеры использования
*
####################################################################################################################

$.x13.init('<?=base_url()?>', '<?=$this->router->controller?>', '<?=$this->router->method?>');

$.x13.processAjaxResponseInterlayer = function (d)
{
	if (d.hashId)
		this.params.hashId = d.hashId;

	if (d.userId)
		this.params.userId = d.userId;

	if (d.description)
		$('#description').attr('content', d.description);

};

$.x13.navEffect = function ()
{
	$('html').css('box-shadow', 'inset 0px 0px 10px 10px rgba(0, 0, 150, 0.2)');
	$('a').css({'cursor': 'wait'});
};

$.x13.navDisEffect = function ()
{
	$('a').css({'cursor': 'pointer'});
	$('html').css('box-shadow', '');
}

$.x13.addRoute('*', letsAjaxAllForms);
$.x13.addRoute('/view', initLightBox);
$.x13.addRoute('/edit', initValidation);
$.x13.addRoute('profile/', initIM);

function letsAjaxAllForms()
{
	//.....
}

function initLightBox()
{
	//.....
}

function initValidation()
{
	//.....
}

function initIM()
{
	//.....
}
*/