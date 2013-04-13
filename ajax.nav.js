window.$$$ = (function ()
{
	/**
	* x13AjaxNav.js - Класс аякс-навигации по сайту и автоматического биндинга событий
	*
	* @author					Marat K. (frostosx, klyde13, icecrust13)
	* @license					GNU GPL 3: http://www.gnu.org/licenses/gpl.html
	* @contacts					klyde13[]gmail.com
	*
	*
	* @param object	params -	объект для хранения служебной информации
	* @param object jQuery -	объект jQuery
	* @class x13AjaxNav
	* @constructor
	*/
	return function x13AjaxNav(params, jQuery)
	{
		//приватная ссылка для доступа к объекту внутри колбеков с измененным контекстом
		var _this = this;
		_this.params = params;
		_this.jQuery = jQuery;

		/**
		* Callback для визуализации загрузки страницы, будет вызываться перед отправкой ajax-запроса
		*
		* @method navEffect
		* @return null
		*/
		this.navEffect = function () {};

		/**
		* Callback для скрытия эффекта визуализации загрузки страницы, будет вызывать после отправки ajax-запроса
		*
		* @method navDisEffect
		* @return null
		*/
		this.navDisEffect = function () {};

		/**
		* Обработка пришедших ajax-данных
		* Если пришлел ответ с полем redirect, то запускает обработку урла redirect и прерывает обработку,
		* иначе устанавливает служебные переменные в объект конфигурации и запускает установку биндов на элементы страницы
		*
		* @method processAjaxResponse
		* @return null
		*/
		this.processAjaxResponse = function (d)
		{
			if (typeof d.redirect != 'undefined')
			{
				history.replaceState(null, null, link);
				return _this.processInternalLink(d.redirect, true);				
			}

			if (typeof d.controller != 'undefined')
				_this.params.controller = d.controller;

			if (typeof d.method != 'undefined')
				_this.params.method = d.method;

			if (typeof d.content != 'undefined')
			{
				var destinationNode;

				if (typeof d.destinationNode != 'undefined')
					destinationNode = d.destinationNode;
						else destinationNode = _this.jQuery('#showContentSpan') ? '#showContentSpan' : 'body';

				_this.jQuery(destinationNode).html(d.content);
			}

			if (typeof _this.processAjaxResponseInterlayer == 'function')
				_this.processAjaxResponseInterlayer(d);

			_this.reloaded();

			_this.lastOk = true;
		};

		/**
		**
		* Прослойка для метода обработки пришедших ajax-данных this.processAjaxResponse
		* @method processAjaxResponseInterlayer
		* @return null
		*/
		this.processAjaxResponseInterlayer = function (d) {};

		/**
		* Метод обработки ошибки ajax-запроса
		*
		* @method isBaseURL
		* @return boolean результат проверки
		*/
		this.processError = function (e)
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
		this.isBaseURL = function (url)
		{
			return (url + "").toLowerCase().indexOf(_this.params.base_url.toLowerCase()) === 0;
		};

		/**
		* Метод обработки URL
		*
		* @method isBaseURL
		* @param string link - url для обработки
		* @return boolean успешность обработки URL
		*/
		this.processInternalLink = function (link)
		{
			if (!_this.isBaseURL(link)) return false;

			_this.lastOk = false;

			if (typeof _this.navEffect == 'function')
				_this.navEffect();

			$.ajax(
				{
					type: "GET",
					dataType: "JSON",
					url: link,
					async: false,
					success: _this.processAjaxResponse,
					error: _this.processError
				}
			);

			if (typeof _this.navEffect == 'function')
				_this.navDisEffect();
			
			return _this.lastOk;
		};

		/**
		* Метод-calback для обработки клика по ссылке
		* Для ajax-Обрабоки ссылка должна быть локальной, а так же ссылка или её первый родитель должны иметь класс x13AjaxNav
		*
		* @method linkClick
		* @param object e - объект события клика
		* @return boolean взвращает true, если сыылка не должна обрабатываться, fasle - если ссылка прошла обработку
		*/
		this.linkClick = function (e)
		{
			var el = _this.jQuery(e.target);

			if (el.prop('tagName') === 'IMG'
				&& el.parent().prop('tagName') === 'A') el = _this.jQuery(el.parent());

			if (el.prop('tagName') !== "A") return true;
			
			var href = el.prop('href');
			if (!_this.isBaseURL(href)) return true;

			if (!el.hasClass('x13AjaxNav') && !el.parent().hasClass('x13AjaxNav')) return true;

			
			if (_this.processInternalLink(href))
				history.pushState(null, null, href);

			e.stopPropagation();
			return false;
				
		};

		/**
		* Метод установки обработчиков событий на странице после её загруки/перезагрузки
		* Для ajax-Обрабоки ссылка должна быть локальной, а так же ссылка или её первый родитель должны иметь класс x13AjaxNav
		*
		* @method reloaded
		* @return null
		*/
		this.reloaded = function ()
		{
			var k;
			for (var k in _this.rebinds['*'])
				_this.rebinds['*'][k]();

			indBind = _this.params.controller.toLowerCase();
			for (k in _this.rebinds['ccontroller'][indBind])
				_this.rebinds['ccontroller'][indBind][k]();

			var indBind = (_this.params.controller + '/' + _this.params.method).toLowerCase();
			for (k in _this.rebinds['controller_and_method'][indBind])
				_this.rebinds['controller_and_method'][indBind][k]();

			var indBind = _this.params.method.toLowerCase();
			for (k in _this.rebinds['method'][indBind])
				_this.rebinds['method'][indBind][k]();
		};

		/**
		* Метод установки функции, которая должна вызываться в зависимости от обработанного uri (controller, method)
		*
		* @param string dest - целевой uri для вызова функции
		* испозуйте "*"" чтобы функция вызывалась после каждой обработки на любоГо uri
		* испозуйте "/myMethod" чтобы функция вызывалась после обработки метода myMethod в любом из контроллеров
		* испозуйте "myController/" чтобы функция вызывалась после каждой обработки на любой странице
		*
		* @param function callBack - функция, которая будет вызываться в зависимости от обрабатываемого uri
		*
		* @method $
		* @return booelan взвращает успешность усановки коллбека
		*/
		this.$ = function (dest, callBack)
		{
			if (_this.rebinds == undefined) 							_this.rebinds = {};
			if (_this.rebinds['*'] == undefined) 						_this.rebinds['*'] = [];
			if (_this.rebinds['method'] == undefined) 					_this.rebinds['method'] = {};
			if (_this.rebinds['ccontroller'] == undefined) 				_this.rebinds['ccontroller'] = {};
			if (_this.rebinds['controller_and_method'] == undefined)	_this.rebinds['controller_and_method'] = {};

			if (dest == '*')
			{
				_this.rebinds['*'].push(callBack);
				return true;
			}

			dest = dest.split('/');

			if ((dest[0] == '*' || dest[0] == '' || dest[0] == undefined) && (dest[1] != '' || dest[1] != undefined))
			{
				if (_this.rebinds['method'][dest[1]] == undefined) _this.rebinds['method'][dest[1]] = [];
				_this.rebinds['method'][dest[1]].push(callBack);
				return true;
			}

			if ((dest[0] != '' || dest[0] != undefined) && (dest[1] == '*' ||dest[1] == '' || dest[1] == undefined))
			{
				if (_this.rebinds['ccontroller'][dest[0]] == undefined) _this.rebinds['ccontroller'][dest[0]] = [];
				_this.rebinds['ccontroller'][dest[1]].push(callBack);
				_this.rebinds['ccontroller'].push(callBack);
				return true;
			}

			if ((dest[0] != '' || dest[0] != undefined) && (dest[1] != '' || dest[1] != undefined))
			{
				var ind = dest[0] + '/' + dest[1];
				if (_this.rebinds['controller_and_method'][ind] == undefined) _this.rebinds['controller_and_method'][ind] = [];
				_this.rebinds['controller_and_method'][ind].push(callBack);
				return true;
			}

			return false;
		};

		//ссылка на экземпляр объекта
		this.$.$ = this;

		_this.jQuery(document).ready(
			function ()
			{
				_this.params.loadedTime = Math.round((new Date()).getTime() / 1000);

				_this.jQuery(window).bind('popstate', 
					function (e)
					{
						if ((now() - _this.params.loadedTime) > 1) //if - костыль для [sctricted]контуженного[/sctricted] хрома
							_this.processInternalLink(window.location);
					}
				);

				_this.jQuery('html').click(_this.linkClick);

				_this.reloaded();
			}
		);

		return this.$;
	}
})();

$$$ = new $$$(window, $);

$$$.$.processAjaxResponseInterlayer = function (d)
{
	if (typeof d.hashId != 'undefined')
		this.params.hashId = d.hashId;

	if (typeof d.userId != 'undefined')
		this.params.userId = d.userId;

	if (typeof d.description != 'undefined')
		this.jQuery('#description').attr('content', d.description);

	if (typeof d.title != 'undefined')
		this.jQuery('title').html(d.title);
};

$$$.$.navEffect = function ()
{
	this.jQuery('html').css('box-shadow', 'inset 0px 0px 10px 10px rgba(0, 0, 150, 0.2)');
	this.jQuery('a').css({'cursor': 'wait'});
};

$$$.$.navDisEffect = function ()
{
	this.jQuery('a').css({'cursor': 'pointer'});
	this.jQuery('html').css('box-shadow', '');
}